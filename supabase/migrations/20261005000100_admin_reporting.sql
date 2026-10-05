-- ============================================================================
-- Admin: order workflow rules, internal order notes and reporting.
--
--   * Allowed order / payment status transitions, enforced for every admin
--     update made through the API (trusted server code — the service role,
--     migrations, seeds — is not restricted).
--   * order_notes: internal staff notes on an order (never shown to customers).
--   * SECURITY DEFINER functions for the admin dashboard, order search,
--     customers and order updates. Each one first checks public.is_admin() and
--     raises insufficient_privilege otherwise; all use a fixed, empty
--     search_path; none is executable by anon.
--
-- Revenue everywhere = order totals excluding cancelled, returned and refunded
-- orders. Days are bucketed in the store's time zone (Asia/Karachi).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Status workflow
-- ---------------------------------------------------------------------------

-- pending → confirmed → processing → shipped → delivered, skipping forward is
-- allowed. Orders can be cancelled until they ship; shipped/delivered orders
-- can be returned; delivered/returned orders refunded. Cancelled and refunded
-- are final.
create or replace function public.order_status_transition_allowed(
  p_from public.order_status,
  p_to public.order_status
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_from
    when 'pending' then p_to in ('confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
    when 'confirmed' then p_to in ('processing', 'shipped', 'delivered', 'cancelled')
    when 'processing' then p_to in ('shipped', 'delivered', 'cancelled')
    when 'shipped' then p_to in ('delivered', 'returned')
    when 'delivered' then p_to in ('returned', 'refunded')
    when 'returned' then p_to in ('refunded')
    else false
  end;
$$;

-- pending → paid | failed, failed → pending | paid, paid → refunded. Refunded is final.
create or replace function public.payment_status_transition_allowed(
  p_from public.payment_status,
  p_to public.payment_status
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_from
    when 'pending' then p_to in ('paid', 'failed')
    when 'failed' then p_to in ('pending', 'paid')
    when 'paid' then p_to in ('refunded')
    else false
  end;
$$;

-- Admins update orders as the "authenticated" API role (RLS: "Admins update
-- orders"); hold every such update to the workflow above.
create or replace function public.orders_enforce_transitions()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce((select auth.jwt()) ->> 'role', '') <> 'authenticated' then
    return new;
  end if;
  if new.status is distinct from old.status
     and not public.order_status_transition_allowed(old.status, new.status) then
    raise exception 'TRANSITION_NOT_ALLOWED'
      using errcode = '22023', detail = format('order status %s -> %s', old.status, new.status);
  end if;
  if new.payment_status is distinct from old.payment_status
     and not public.payment_status_transition_allowed(old.payment_status, new.payment_status) then
    raise exception 'TRANSITION_NOT_ALLOWED'
      using errcode = '22023', detail = format('payment status %s -> %s', old.payment_status, new.payment_status);
  end if;
  return new;
end;
$$;

drop trigger if exists orders_enforce_transitions on public.orders;
create trigger orders_enforce_transitions
  before update of status, payment_status on public.orders
  for each row execute function public.orders_enforce_transitions();

-- ---------------------------------------------------------------------------
-- Internal order notes (staff only)
-- ---------------------------------------------------------------------------
create table if not exists public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  author_name text not null default 'Admin' check (char_length(author_name) between 1 and 160),
  body text not null check (char_length(body) between 1 and 1000),
  -- 'note' = written by staff; 'payment' = logged automatically on payment changes.
  kind text not null default 'note' check (kind in ('note', 'payment')),
  created_at timestamptz not null default now()
);
create index if not exists order_notes_order_idx on public.order_notes (order_id, created_at desc);

alter table public.order_notes enable row level security;

drop policy if exists "Admins read order notes" on public.order_notes;
create policy "Admins read order notes" on public.order_notes
  for select to authenticated using ((select public.is_admin()));

-- Notes are written only through admin_add_order_note() / admin_update_order_payment().
revoke all on public.order_notes from anon, authenticated;
grant select on public.order_notes to authenticated;

-- ---------------------------------------------------------------------------
-- Order updates
-- ---------------------------------------------------------------------------

-- Changes an order's status. The orders_after_status_change trigger records
-- the history row (and restocks on cancellation); an optional note — shown to
-- the customer on their order timeline — is attached to that row.
-- p_expected guards against overwriting a change made meanwhile by someone else.
create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_status public.order_status,
  p_note text default null,
  p_expected public.order_status default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = 'insufficient_privilege';
  end if;
  if p_status is null then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;
  if v_note is not null and char_length(v_note) > 500 then
    raise exception 'NOTE_TOO_LONG' using errcode = '22023';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'no_data_found';
  end if;
  if p_expected is not null and v_order.status <> p_expected then
    raise exception 'ORDER_CHANGED' using errcode = '40001', detail = v_order.status::text;
  end if;
  if v_order.status = p_status then
    raise exception 'STATUS_UNCHANGED' using errcode = '22023';
  end if;
  if not public.order_status_transition_allowed(v_order.status, p_status) then
    raise exception 'TRANSITION_NOT_ALLOWED'
      using errcode = '22023', detail = format('order status %s -> %s', v_order.status, p_status);
  end if;

  update public.orders set status = p_status where id = p_order_id;

  if v_note is not null then
    update public.order_status_history h
    set note = v_note
    where h.id = (
      select h2.id from public.order_status_history h2
      where h2.order_id = p_order_id and h2.status = p_status and h2.note is null
      order by h2.created_at desc
      limit 1
    );
  end if;

  return jsonb_build_object('id', p_order_id, 'previous_status', v_order.status, 'status', p_status);
end;
$$;

-- Changes the payment status and/or payment reference, and logs the change as
-- an internal note.
create or replace function public.admin_update_order_payment(
  p_order_id uuid,
  p_payment_status public.payment_status,
  p_reference text default null,
  p_expected public.payment_status default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_ref text := nullif(btrim(coalesce(p_reference, '')), '');
  v_parts text[] := '{}';
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = 'insufficient_privilege';
  end if;
  if p_payment_status is null then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;
  if v_ref is not null and char_length(v_ref) > 120 then
    raise exception 'REFERENCE_TOO_LONG' using errcode = '22023';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'no_data_found';
  end if;
  if p_expected is not null and v_order.payment_status <> p_expected then
    raise exception 'ORDER_CHANGED' using errcode = '40001', detail = v_order.payment_status::text;
  end if;
  if v_order.payment_status = p_payment_status and v_order.payment_reference is not distinct from v_ref then
    raise exception 'PAYMENT_UNCHANGED' using errcode = '22023';
  end if;
  if v_order.payment_status <> p_payment_status
     and not public.payment_status_transition_allowed(v_order.payment_status, p_payment_status) then
    raise exception 'TRANSITION_NOT_ALLOWED'
      using errcode = '22023', detail = format('payment status %s -> %s', v_order.payment_status, p_payment_status);
  end if;

  update public.orders
  set payment_status = p_payment_status, payment_reference = v_ref
  where id = p_order_id;

  if v_order.payment_status <> p_payment_status then
    v_parts := v_parts || format('Payment marked %s (was %s)', p_payment_status, v_order.payment_status);
  end if;
  if v_order.payment_reference is distinct from v_ref then
    v_parts := v_parts || case when v_ref is null then 'Payment reference removed' else format('Payment reference: %s', v_ref) end;
  end if;

  insert into public.order_notes (order_id, author_id, author_name, body, kind)
  values (
    p_order_id,
    (select auth.uid()),
    coalesce(
      (select nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), '') from public.profiles p where p.id = (select auth.uid())),
      'Admin'
    ),
    array_to_string(v_parts, ' · '),
    'payment'
  );

  return jsonb_build_object(
    'id', p_order_id,
    'previous_payment_status', v_order.payment_status,
    'payment_status', p_payment_status,
    'payment_reference', v_ref
  );
end;
$$;

-- Adds an internal note to an order.
create or replace function public.admin_add_order_note(p_order_id uuid, p_body text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_body text := btrim(coalesce(p_body, ''));
  v_note public.order_notes%rowtype;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = 'insufficient_privilege';
  end if;
  if char_length(v_body) < 1 or char_length(v_body) > 1000 then
    raise exception 'INVALID_NOTE' using errcode = '22023';
  end if;
  if not exists (select 1 from public.orders o where o.id = p_order_id) then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  insert into public.order_notes (order_id, author_id, author_name, body, kind)
  values (
    p_order_id,
    (select auth.uid()),
    coalesce(
      (select nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), '') from public.profiles p where p.id = (select auth.uid())),
      'Admin'
    ),
    v_body,
    'note'
  )
  returning * into v_note;

  return to_jsonb(v_note);
end;
$$;

-- ---------------------------------------------------------------------------
-- Order search for the admin list
-- ---------------------------------------------------------------------------

-- Every word of p_query must appear in the order number, email, phone or the
-- shipping/billing name. Sorts: newest (default), oldest, total_desc, total_asc.
create or replace function public.admin_orders(
  p_query text default null,
  p_status public.order_status default null,
  p_payment_status public.payment_status default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_sort text default 'newest',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  order_number text,
  created_at timestamptz,
  email text,
  customer_name text,
  user_id uuid,
  item_count integer,
  total numeric,
  payment_method text,
  payment_status public.payment_status,
  status public.order_status,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_terms text[] := array(
    select t from unnest(regexp_split_to_array(btrim(coalesce(left(p_query, 200), '')), '\s+')) as t
    where t <> '' limit 6
  );
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = 'insufficient_privilege';
  end if;

  return query
  with filtered as (
    select o.*
    from public.orders o
    where (p_status is null or o.status = p_status)
      and (p_payment_status is null or o.payment_status = p_payment_status)
      and (p_from is null or o.created_at >= p_from)
      and (p_to is null or o.created_at < p_to)
      and not exists (
        select 1 from unnest(v_terms) as t
        where concat_ws(' ',
          o.order_number, o.email::text, o.phone,
          o.shipping_address ->> 'first_name', o.shipping_address ->> 'last_name',
          o.billing_address ->> 'first_name', o.billing_address ->> 'last_name'
        ) not ilike '%' || public.escape_like(t) || '%'
      )
  )
  select
    f.id,
    f.order_number,
    f.created_at,
    f.email::text,
    nullif(btrim(concat_ws(' ', f.shipping_address ->> 'first_name', f.shipping_address ->> 'last_name')), ''),
    f.user_id,
    coalesce((select sum(oi.quantity)::integer from public.order_items oi where oi.order_id = f.id), 0),
    f.total::numeric,
    f.payment_method,
    f.payment_status,
    f.status,
    count(*) over ()
  from filtered f
  order by
    case when p_sort = 'total_desc' then f.total end desc nulls last,
    case when p_sort = 'total_asc' then f.total end asc nulls last,
    case when p_sort = 'oldest' then f.created_at end asc nulls last,
    f.created_at desc,
    f.id
  limit least(greatest(coalesce(p_limit, 20), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

-- ---------------------------------------------------------------------------
-- Dashboard
-- ---------------------------------------------------------------------------

-- KPIs for [p_from, p_to) and the period of the same length before it,
-- revenue per day, orders by status, top products, plus store-wide counts
-- (open orders, pending reviews, low stock, recent orders).
create or replace function public.admin_dashboard_stats(
  p_from timestamptz,
  p_to timestamptz,
  p_tz text default 'Asia/Karachi',
  p_low_stock integer default 3
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_prev_from timestamptz;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = 'insufficient_privilege';
  end if;
  if p_from is null or p_to is null or p_to <= p_from or p_to - p_from > interval '400 days' then
    raise exception 'INVALID_RANGE' using errcode = '22023';
  end if;
  if p_tz is null or not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = p_tz) then
    raise exception 'INVALID_TIME_ZONE' using errcode = '22023';
  end if;
  v_prev_from := p_from - (p_to - p_from);

  with
  windowed as (
    select
      o.id,
      o.created_at,
      o.status,
      o.total,
      lower(o.email::text) as email,
      o.created_at >= p_from as is_current,
      o.status not in ('cancelled', 'returned', 'refunded') as counts
    from public.orders o
    where o.created_at >= v_prev_from and o.created_at < p_to
  ),
  summary as (
    select
      w.is_current,
      count(*) as orders,
      count(*) filter (where w.counts) as revenue_orders,
      coalesce(sum(w.total) filter (where w.counts), 0) as revenue,
      count(distinct w.email) as customers
    from windowed w
    group by w.is_current
  ),
  days as (
    select d::date as day
    from generate_series(
      (p_from at time zone p_tz)::date::timestamp,
      ((p_to - interval '1 microsecond') at time zone p_tz)::date::timestamp,
      interval '1 day'
    ) as d
  ),
  daily as (
    select
      (w.created_at at time zone p_tz)::date as day,
      count(*) as orders,
      coalesce(sum(w.total) filter (where w.counts), 0) as revenue
    from windowed w
    where w.is_current
    group by 1
  ),
  product_sales as (
    select
      coalesce(oi.product_id::text, oi.product_name) as key,
      (array_agg(oi.product_id))[1] as product_id,
      max(oi.product_name) as snapshot_name,
      max(oi.image_url) as snapshot_image,
      sum(oi.quantity)::bigint as units,
      sum(oi.line_total) as revenue
    from public.order_items oi
    join windowed w on w.id = oi.order_id
    where w.is_current and w.counts
    group by 1
  ),
  product_rows as (
    select
      ps.product_id,
      coalesce(p.name, ps.snapshot_name) as name,
      p.slug::text as slug,
      coalesce(
        (select pi.url from public.product_images pi where pi.product_id = ps.product_id order by pi.position limit 1),
        ps.snapshot_image
      ) as image_url,
      ps.units,
      ps.revenue
    from product_sales ps
    left join public.products p on p.id = ps.product_id
  )
  select jsonb_build_object(
    'current', coalesce(
      (select jsonb_build_object('orders', s.orders, 'revenue_orders', s.revenue_orders, 'revenue', s.revenue, 'customers', s.customers)
       from summary s where s.is_current),
      jsonb_build_object('orders', 0, 'revenue_orders', 0, 'revenue', 0, 'customers', 0)
    ),
    'previous', coalesce(
      (select jsonb_build_object('orders', s.orders, 'revenue_orders', s.revenue_orders, 'revenue', s.revenue, 'customers', s.customers)
       from summary s where not s.is_current),
      jsonb_build_object('orders', 0, 'revenue_orders', 0, 'revenue', 0, 'customers', 0)
    ),
    'daily', coalesce(
      (select jsonb_agg(jsonb_build_object('day', d.day, 'orders', coalesce(x.orders, 0), 'revenue', coalesce(x.revenue, 0)) order by d.day)
       from days d left join daily x on x.day = d.day),
      '[]'::jsonb
    ),
    'by_status', coalesce(
      (select jsonb_object_agg(t.status, t.n) from (
        select w.status::text as status, count(*) as n from windowed w where w.is_current group by 1
      ) t),
      '{}'::jsonb
    ),
    'top_by_revenue', coalesce(
      (select jsonb_agg(to_jsonb(r)) from (
        select * from product_rows order by revenue desc, units desc, name limit 5
      ) r),
      '[]'::jsonb
    ),
    'top_by_units', coalesce(
      (select jsonb_agg(to_jsonb(r)) from (
        select * from product_rows order by units desc, revenue desc, name limit 5
      ) r),
      '[]'::jsonb
    )
  )
  into v_result;

  with low as (
    select v.id as variant_id, v.product_id, p.name as product_name, v.name as variant_name, v.sku, v.stock_quantity as stock
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where p.status <> 'archived' and v.stock_quantity <= p_low_stock
    union all
    select null::uuid, p.id, p.name, null::text, p.sku, p.stock_quantity
    from public.products p
    where p.status <> 'archived' and p.stock_quantity <= p_low_stock
      and not exists (select 1 from public.product_variants v where v.product_id = p.id)
  )
  select v_result || jsonb_build_object(
    'open_orders', (select count(*) from public.orders o where o.status in ('pending', 'confirmed', 'processing')),
    'pending_reviews', (select count(*) from public.reviews r where r.status = 'pending'),
    'low_stock_count', (select count(*) from low),
    'low_stock', coalesce(
      (select jsonb_agg(to_jsonb(l)) from (select * from low order by stock, product_name, variant_name limit 8) l),
      '[]'::jsonb
    ),
    'recent_orders', coalesce(
      (select jsonb_agg(to_jsonb(r) order by r.created_at desc) from (
        select
          o.id, o.order_number, o.created_at, o.email::text as email,
          nullif(btrim(concat_ws(' ', o.shipping_address ->> 'first_name', o.shipping_address ->> 'last_name')), '') as customer_name,
          o.total, o.status, o.payment_status
        from public.orders o
        order by o.created_at desc
        limit 6
      ) r),
      '[]'::jsonb
    )
  )
  into v_result;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

-- Customers are accounts (auth.users + profiles) and guests (emails that
-- ordered without an account). A guest order is credited to the account with
-- the same email when one exists. Guests get a stable id derived from their
-- email. Sorts: recent (newest first, default), spent, orders, last_order.
create or replace function public.admin_customers(
  p_query text default null,
  p_sort text default 'recent',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  registered boolean,
  role text,
  joined_at timestamptz,
  order_count bigint,
  total_spent numeric,
  last_order_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_terms text[] := array(
    select t from unnest(regexp_split_to_array(btrim(coalesce(left(p_query, 200), '')), '\s+')) as t
    where t <> '' limit 6
  );
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = 'insufficient_privilege';
  end if;

  return query
  with owned as (
    select
      o.id as order_id,
      o.created_at,
      o.total,
      o.status,
      o.shipping_address,
      lower(o.email::text) as email,
      coalesce(o.user_id, acct.id) as user_id
    from public.orders o
    left join lateral (
      select u.id from auth.users u
      where o.user_id is null and lower(u.email) = lower(o.email::text)
      order by u.created_at
      limit 1
    ) acct on true
  ),
  people as (
    select
      u.id,
      lower(u.email) as email,
      p.first_name,
      p.last_name,
      coalesce(p.phone, u.phone::text) as phone,
      true as registered,
      coalesce(p.role::text, 'customer') as role,
      u.created_at as joined_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    union all
    select
      md5('guest:' || g.email)::uuid,
      g.email,
      g.first_name,
      g.last_name,
      g.phone,
      false,
      'guest',
      g.first_order_at
    from (
      select
        ow.email,
        min(ow.created_at) as first_order_at,
        (array_agg(ow.shipping_address ->> 'first_name' order by ow.created_at desc))[1] as first_name,
        (array_agg(ow.shipping_address ->> 'last_name' order by ow.created_at desc))[1] as last_name,
        (array_agg(ow.shipping_address ->> 'phone' order by ow.created_at desc))[1] as phone
      from owned ow
      where ow.user_id is null
      group by ow.email
    ) g
  ),
  stats as (
    select
      coalesce(ow.user_id, md5('guest:' || ow.email)::uuid) as customer_id,
      count(*) as order_count,
      coalesce(sum(ow.total) filter (where ow.status not in ('cancelled', 'returned', 'refunded')), 0)::numeric as total_spent,
      max(ow.created_at) as last_order_at
    from owned ow
    group by 1
  ),
  matched as (
    select
      pe.*,
      coalesce(s.order_count, 0) as order_count,
      coalesce(s.total_spent, 0) as total_spent,
      s.last_order_at
    from people pe
    left join stats s on s.customer_id = pe.id
    where not exists (
      select 1 from unnest(v_terms) as t
      where concat_ws(' ', pe.email, pe.first_name, pe.last_name, pe.phone) not ilike '%' || public.escape_like(t) || '%'
    )
  )
  select
    m.id, m.email, m.first_name, m.last_name, m.phone, m.registered, m.role, m.joined_at,
    m.order_count, m.total_spent, m.last_order_at,
    count(*) over ()
  from matched m
  order by
    case when p_sort = 'spent' then m.total_spent end desc nulls last,
    case when p_sort = 'orders' then m.order_count end desc nulls last,
    case when p_sort = 'last_order' then m.last_order_at end desc nulls last,
    m.joined_at desc,
    m.id
  limit least(greatest(coalesce(p_limit, 20), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

-- One customer (account id, or a guest id from admin_customers) with their
-- saved addresses and orders, or null when there is no such customer.
create or replace function public.admin_customer(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_customer jsonb;
  v_email text;
  v_account uuid;
  v_registered boolean := false;
  v_orders jsonb;
  v_addresses jsonb := '[]'::jsonb;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = 'insufficient_privilege';
  end if;
  if p_id is null then
    return null;
  end if;

  select
    jsonb_build_object(
      'id', u.id,
      'email', lower(u.email),
      'first_name', p.first_name,
      'last_name', p.last_name,
      'phone', coalesce(p.phone, u.phone::text),
      'registered', true,
      'role', coalesce(p.role::text, 'customer'),
      'joined_at', u.created_at
    ),
    lower(u.email)
  into v_customer, v_email
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = p_id;

  if v_customer is not null then
    v_registered := true;
  else
    -- A guest: an email that ordered without an account.
    select lower(o.email::text) into v_email
    from public.orders o
    where o.user_id is null and md5('guest:' || lower(o.email::text))::uuid = p_id
    limit 1;
    if v_email is null then
      return null;
    end if;
    -- Guest orders belong to the account with that email, when there is one
    -- (the result's customer.id then differs from p_id).
    select u.id into v_account from auth.users u where lower(u.email) = v_email order by u.created_at limit 1;
    if v_account is not null then
      return public.admin_customer(v_account);
    end if;
    select jsonb_build_object(
      'id', p_id,
      'email', v_email,
      'first_name', o.shipping_address ->> 'first_name',
      'last_name', o.shipping_address ->> 'last_name',
      'phone', coalesce(o.phone, o.shipping_address ->> 'phone'),
      'registered', false,
      'role', 'guest',
      'joined_at', (select min(o2.created_at) from public.orders o2 where o2.user_id is null and lower(o2.email::text) = v_email)
    )
    into v_customer
    from public.orders o
    where o.user_id is null and lower(o.email::text) = v_email
    order by o.created_at desc
    limit 1;
  end if;

  -- Same attribution as admin_customers(): guest orders go to the (oldest)
  -- account with that email.
  with mine as (
    select o.*
    from public.orders o
    where (v_registered and o.user_id = p_id)
       or (o.user_id is null and lower(o.email::text) = v_email
           and (not v_registered or p_id = (
             select u.id from auth.users u where lower(u.email) = v_email order by u.created_at limit 1
           )))
  )
  select jsonb_build_object(
    'orders', coalesce(jsonb_agg(jsonb_build_object(
      'id', m.id,
      'order_number', m.order_number,
      'created_at', m.created_at,
      'status', m.status,
      'payment_status', m.payment_status,
      'payment_method', m.payment_method,
      'total', m.total,
      'item_count', coalesce((select sum(oi.quantity) from public.order_items oi where oi.order_id = m.id), 0),
      'shipping_address', m.shipping_address
    ) order by m.created_at desc), '[]'::jsonb),
    'order_count', count(m.id),
    'total_spent', coalesce(sum(m.total) filter (where m.status not in ('cancelled', 'returned', 'refunded')), 0),
    'last_order_at', max(m.created_at)
  )
  into v_orders
  from mine m;

  if v_registered then
    select coalesce(jsonb_agg(to_jsonb(a) order by a.is_default desc, a.created_at desc), '[]'::jsonb)
    into v_addresses
    from public.addresses a
    where a.user_id = p_id;
  end if;

  return jsonb_build_object('customer', v_customer, 'addresses', v_addresses) || v_orders;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
revoke execute on function public.order_status_transition_allowed(public.order_status, public.order_status) from public, anon;
revoke execute on function public.payment_status_transition_allowed(public.payment_status, public.payment_status) from public, anon;
grant execute on function public.order_status_transition_allowed(public.order_status, public.order_status) to authenticated, service_role;
grant execute on function public.payment_status_transition_allowed(public.payment_status, public.payment_status) to authenticated, service_role;

revoke execute on function public.orders_enforce_transitions() from public, anon, authenticated;

revoke execute on function public.admin_update_order_status(uuid, public.order_status, text, public.order_status) from public, anon;
revoke execute on function public.admin_update_order_payment(uuid, public.payment_status, text, public.payment_status) from public, anon;
revoke execute on function public.admin_add_order_note(uuid, text) from public, anon;
revoke execute on function public.admin_orders(text, public.order_status, public.payment_status, timestamptz, timestamptz, text, integer, integer) from public, anon;
revoke execute on function public.admin_dashboard_stats(timestamptz, timestamptz, text, integer) from public, anon;
revoke execute on function public.admin_customers(text, text, integer, integer) from public, anon;
revoke execute on function public.admin_customer(uuid) from public, anon;

grant execute on function public.admin_update_order_status(uuid, public.order_status, text, public.order_status) to authenticated;
grant execute on function public.admin_update_order_payment(uuid, public.payment_status, text, public.payment_status) to authenticated;
grant execute on function public.admin_add_order_note(uuid, text) to authenticated;
grant execute on function public.admin_orders(text, public.order_status, public.payment_status, timestamptz, timestamptz, text, integer, integer) to authenticated;
grant execute on function public.admin_dashboard_stats(timestamptz, timestamptz, text, integer) to authenticated;
grant execute on function public.admin_customers(text, text, integer, integer) to authenticated;
grant execute on function public.admin_customer(uuid) to authenticated;

notify pgrst, 'reload schema';

-- ============================================================================
-- Business logic in the database
--   * Profile bootstrap on sign-up
--   * Review integrity (verified purchase, moderation, rating aggregates)
--   * Authoritative cart pricing  -> calculate_cart()
--   * Atomic order placement with inventory locking -> place_order()
--   * Restock on cancellation, order status history
--   * Catalogue search & facets (RLS-respecting, SECURITY INVOKER)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- True when the current request is trusted server code: the service role
-- key, or a direct database connection (migrations / SQL editor / seeds).
create or replace function public.is_privileged_request()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce((select auth.jwt()) ->> 'role', 'service_role') = 'service_role'
      or (select public.is_admin());
$$;

-- Units available to sell: variant stock when the product has variants,
-- otherwise the product-level stock.
create or replace function public.product_available_quantity(p_product_id uuid)
returns integer
language sql
stable
set search_path = public
as $$
  select case
    when exists (select 1 from public.product_variants v where v.product_id = p_product_id)
      then (select coalesce(sum(v.stock_quantity), 0)::integer from public.product_variants v where v.product_id = p_product_id)
    else (select p.stock_quantity from public.products p where p.id = p_product_id)
  end;
$$;

-- Escape LIKE wildcards in user input.
create or replace function public.escape_like(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select replace(replace(replace(p_value, '\', '\\'), '%', '\%'), '_', '\_');
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, phone)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'last_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'phone'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
create or replace function public.reviews_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first text;
  v_last text;
begin
  -- Verified purchase is always derived, never trusted from the client.
  new.verified_purchase := exists (
    select 1
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where o.user_id = new.user_id
      and oi.product_id = new.product_id
      and o.status in ('confirmed', 'processing', 'shipped', 'delivered')
  );

  if tg_op = 'INSERT' then
    select first_name, last_name into v_first, v_last from public.profiles where id = new.user_id;
    new.author_name := coalesce(
      nullif(btrim(coalesce(v_first, '') || ' ' || coalesce(left(v_last, 1) || '.', '')), ''),
      'Customer'
    );
  else
    new.author_name := old.author_name;
    new.user_id := old.user_id;
    new.product_id := old.product_id;
  end if;

  -- Customers cannot self-approve: verified buyers publish instantly,
  -- everyone else goes to moderation. Admins / server keep their status.
  if not public.is_privileged_request() then
    new.status := case when new.verified_purchase then 'approved'::public.review_status
                       else 'pending'::public.review_status end;
  end if;

  return new;
end;
$$;

create trigger reviews_before_write
  before insert or update on public.reviews
  for each row execute function public.reviews_before_write();

create or replace function public.refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
  set rating_avg = coalesce(s.avg_rating, 0),
      rating_count = coalesce(s.review_count, 0)
  from (
    select round(avg(r.rating)::numeric, 2) as avg_rating, count(*)::integer as review_count
    from public.reviews r
    where r.product_id = v_product_id and r.status = 'approved'
  ) s
  where p.id = v_product_id;
  return null;
end;
$$;

create trigger reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();

-- ---------------------------------------------------------------------------
-- Pricing — the single source of truth for every total shown or charged.
-- p_items: [{ "product_id": uuid, "variant_id": uuid | null, "quantity": int }]
-- ---------------------------------------------------------------------------
create or replace function public.calculate_cart(
  p_items jsonb,
  p_shipping_method text default null,
  p_coupon_code text default null,
  p_country text default 'PK',
  p_user_id uuid default null,
  p_email text default null,
  p_tax_rate numeric default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  r record;
  v_lines jsonb := '[]'::jsonb;
  v_errors jsonb := '[]'::jsonb;
  v_status text;
  v_unit numeric(12, 2);
  v_compare numeric(12, 2);
  v_subtotal numeric(12, 2) := 0;
  v_discount numeric(12, 2) := 0;
  v_shipping numeric(12, 2) := 0;
  v_tax numeric(12, 2) := 0;
  v_item_count integer := 0;
  v_can_checkout boolean := true;
  v_code text := nullif(upper(btrim(coalesce(p_coupon_code, ''))), '');
  v_coupon public.coupons%rowtype;
  v_coupon_json jsonb := null;
  v_coupon_message text;
  v_used integer;
  v_methods jsonb := '[]'::jsonb;
  v_selected_code text := null;
  v_selected_name text := null;
  m record;
  v_cost numeric(12, 2);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ITEMS' using errcode = '22023';
  end if;
  if p_tax_rate is null or p_tax_rate < 0 or p_tax_rate > 1 then
    raise exception 'INVALID_TAX_RATE' using errcode = '22023';
  end if;

  -- 1. Lines ---------------------------------------------------------------
  for r in
    with req as (
      select (e ->> 'product_id')::uuid as product_id,
             nullif(e ->> 'variant_id', '')::uuid as variant_id,
             sum(greatest((e ->> 'quantity')::integer, 0))::integer as quantity,
             min(ordinality) as ord
      from jsonb_array_elements(p_items) with ordinality as t(e, ordinality)
      group by 1, 2
    )
    select req.product_id, req.variant_id, req.quantity,
           p.id as found_product_id, p.name, p.slug, p.status, p.sku as product_sku,
           p.price as product_price, p.compare_at_price, p.stock_quantity as product_stock,
           v.id as found_variant_id, v.name as variant_name, v.sku as variant_sku,
           v.size, v.color, v.price as variant_price, v.stock_quantity as variant_stock,
           exists (select 1 from public.product_variants pv where pv.product_id = req.product_id) as has_variants,
           (select pi.url from public.product_images pi
             where pi.product_id = req.product_id order by pi.position limit 1) as image_url
    from req
    left join public.products p on p.id = req.product_id
    left join public.product_variants v on v.id = req.variant_id and v.product_id = req.product_id
    order by req.ord
  loop
    v_status := 'ok';
    if r.found_product_id is null or r.status <> 'active' then
      v_status := 'unavailable';
    elsif r.variant_id is not null and r.found_variant_id is null then
      v_status := 'unavailable';
    elsif r.variant_id is null and r.has_variants then
      v_status := 'variant_required';
    elsif r.quantity < 1 then
      v_status := 'invalid_quantity';
    elsif coalesce(r.variant_stock, r.product_stock, 0) = 0 then
      v_status := 'sold_out';
    elsif coalesce(r.variant_stock, r.product_stock, 0) < r.quantity then
      v_status := 'insufficient_stock';
    end if;

    v_unit := coalesce(r.variant_price, r.product_price, 0);
    v_compare := case when r.compare_at_price > v_unit then r.compare_at_price else null end;

    if v_status in ('ok', 'insufficient_stock') then
      v_subtotal := v_subtotal + v_unit * r.quantity;
      v_item_count := v_item_count + r.quantity;
    end if;

    if v_status <> 'ok' then
      v_can_checkout := false;
      v_errors := v_errors || jsonb_build_object(
        'product_id', r.product_id, 'variant_id', r.variant_id, 'code', v_status,
        'available', coalesce(r.variant_stock, r.product_stock, 0)
      );
    end if;

    v_lines := v_lines || jsonb_build_object(
      'product_id', r.product_id,
      'variant_id', r.variant_id,
      'quantity', r.quantity,
      'name', r.name,
      'slug', r.slug,
      'image_url', r.image_url,
      'sku', coalesce(r.variant_sku, r.product_sku),
      'variant_name', r.variant_name,
      'size', r.size,
      'color', r.color,
      'unit_price', v_unit,
      'compare_at_price', v_compare,
      'line_total', v_unit * r.quantity,
      'available', coalesce(r.variant_stock, r.product_stock, 0),
      'status', v_status
    );
  end loop;

  if jsonb_array_length(v_lines) = 0 then
    v_can_checkout := false;
  end if;

  -- 2. Coupon --------------------------------------------------------------
  if v_code is not null then
    select * into v_coupon from public.coupons where code = v_code::extensions.citext;

    if not found or not v_coupon.active then
      v_coupon_message := 'This code is not valid.';
    elsif v_coupon.starts_at is not null and v_coupon.starts_at > now() then
      v_coupon_message := 'This code is not active yet.';
    elsif v_coupon.expires_at is not null and v_coupon.expires_at <= now() then
      v_coupon_message := 'This code has expired.';
    elsif v_coupon.usage_limit is not null and v_coupon.times_used >= v_coupon.usage_limit then
      v_coupon_message := 'This code has reached its usage limit.';
    elsif v_subtotal < v_coupon.minimum_order then
      v_coupon_message := format('Spend Rs. %s or more to use this code.', to_char(v_coupon.minimum_order, 'FM999,999,990'));
    else
      if v_coupon.usage_limit_per_customer is not null and (p_user_id is not null or p_email is not null) then
        select count(*) into v_used
        from public.coupon_usage cu
        where cu.coupon_id = v_coupon.id
          and ((p_user_id is not null and cu.user_id = p_user_id)
            or (p_email is not null and cu.email = p_email::extensions.citext));
        if v_used >= v_coupon.usage_limit_per_customer then
          v_coupon_message := 'You have already used this code.';
        end if;
      end if;
    end if;

    if v_coupon_message is null then
      if v_coupon.type = 'percentage' then
        v_discount := round(v_subtotal * v_coupon.value / 100, 0);
      else
        v_discount := v_coupon.value;
      end if;
      if v_coupon.maximum_discount is not null then
        v_discount := least(v_discount, v_coupon.maximum_discount);
      end if;
      v_discount := least(v_discount, v_subtotal);
      v_coupon_json := jsonb_build_object('code', v_code, 'valid', true, 'description', v_coupon.description, 'message', null);
    else
      v_coupon_json := jsonb_build_object('code', v_code, 'valid', false, 'description', null, 'message', v_coupon_message);
    end if;
  end if;

  -- 3. Shipping ------------------------------------------------------------
  for m in
    select sm.*
    from public.shipping_methods sm
    where sm.is_active
      and (sm.countries is null or upper(coalesce(p_country, 'PK')) = any (sm.countries))
    order by sm.position, sm.price
  loop
    v_cost := case
      when v_item_count = 0 then 0
      when m.free_shipping_threshold is not null and (v_subtotal - v_discount) >= m.free_shipping_threshold then 0
      else m.price
    end;
    v_methods := v_methods || jsonb_build_object(
      'code', m.code, 'name', m.name, 'description', m.description, 'cost', v_cost,
      'base_price', m.price, 'free_shipping_threshold', m.free_shipping_threshold,
      'min_days', m.min_days, 'max_days', m.max_days
    );
    if v_selected_code is null and (p_shipping_method is null or p_shipping_method = m.code) then
      v_selected_code := m.code;
      v_selected_name := m.name;
      v_shipping := v_cost;
    end if;
  end loop;

  if v_selected_code is null then
    v_can_checkout := false;
    v_errors := v_errors || jsonb_build_object('code', 'shipping_unavailable');
  end if;

  -- 4. Tax & total ---------------------------------------------------------
  v_tax := round((v_subtotal - v_discount) * p_tax_rate, 0);

  return jsonb_build_object(
    'lines', v_lines,
    'item_count', v_item_count,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'coupon', v_coupon_json,
    'shipping_methods', v_methods,
    'shipping_method', v_selected_code,
    'shipping_method_name', v_selected_name,
    'shipping', v_shipping,
    'tax', v_tax,
    'total', v_subtotal - v_discount + v_shipping + v_tax,
    'currency', 'PKR',
    'can_checkout', v_can_checkout,
    'errors', v_errors
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Atomic order placement.
-- Locks the inventory rows involved, re-prices everything from the database,
-- decrements stock, writes the order with item snapshots and records coupon
-- usage — all in one transaction. Never trust totals from the browser.
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_user_id uuid,
  p_email text,
  p_phone text,
  p_items jsonb,
  p_shipping_method text,
  p_coupon_code text,
  p_payment_method text,
  p_payment_provider text,
  p_shipping_address jsonb,
  p_billing_address jsonb,
  p_notes text default null,
  p_tax_rate numeric default 0,
  p_initial_status public.order_status default 'pending'
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_calc jsonb;
  v_line jsonb;
  v_order public.orders%rowtype;
  v_coupon_id uuid;
  v_code text := nullif(upper(btrim(coalesce(p_coupon_code, ''))), '');
  v_country text := upper(coalesce(p_shipping_address ->> 'country', 'PK'));
begin
  if p_email is null or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'INVALID_EMAIL' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'TOO_MANY_ITEMS' using errcode = '22023';
  end if;
  if p_initial_status not in ('pending', 'confirmed') then
    raise exception 'INVALID_INITIAL_STATUS' using errcode = '22023';
  end if;

  -- Lock inventory rows in a deterministic order to avoid deadlocks between
  -- concurrent checkouts. Waiting here serialises competing buyers.
  perform 1
  from public.product_variants
  where id in (select nullif(e ->> 'variant_id', '')::uuid from jsonb_array_elements(p_items) e)
  order by id
  for update;

  perform 1
  from public.products
  where id in (
    select (e ->> 'product_id')::uuid from jsonb_array_elements(p_items) e
    where nullif(e ->> 'variant_id', '') is null
  )
  order by id
  for update;

  if v_code is not null then
    select id into v_coupon_id from public.coupons where code = v_code::extensions.citext for update;
  end if;

  -- Re-price with the locked, current data.
  v_calc := public.calculate_cart(
    p_items, p_shipping_method, v_code, v_country, p_user_id, p_email, p_tax_rate
  );

  if v_code is not null and not coalesce((v_calc -> 'coupon' ->> 'valid')::boolean, false) then
    raise exception 'COUPON_INVALID' using errcode = 'P0001', detail = coalesce(v_calc -> 'coupon' ->> 'message', '');
  end if;
  if not (v_calc ->> 'can_checkout')::boolean then
    raise exception 'CART_INVALID' using errcode = 'P0001', detail = (v_calc -> 'errors')::text;
  end if;
  if p_shipping_method is not null and v_calc ->> 'shipping_method' is distinct from p_shipping_method then
    raise exception 'SHIPPING_METHOD_UNAVAILABLE' using errcode = 'P0001';
  end if;

  insert into public.orders (
    user_id, email, phone, status, payment_status, payment_method, payment_provider,
    shipping_method, shipping_method_name, subtotal, discount, shipping_cost, tax, total,
    currency, coupon_code, shipping_address, billing_address, notes
  ) values (
    p_user_id, lower(btrim(p_email)), nullif(btrim(p_phone), ''), p_initial_status, 'pending',
    p_payment_method, p_payment_provider,
    v_calc ->> 'shipping_method', v_calc ->> 'shipping_method_name',
    (v_calc ->> 'subtotal')::numeric, (v_calc ->> 'discount')::numeric,
    (v_calc ->> 'shipping')::numeric, (v_calc ->> 'tax')::numeric, (v_calc ->> 'total')::numeric,
    'PKR', case when v_coupon_id is not null then v_code end,
    p_shipping_address, p_billing_address, nullif(btrim(p_notes), '')
  )
  returning * into v_order;

  for v_line in select value from jsonb_array_elements(v_calc -> 'lines')
  loop
    insert into public.order_items (
      order_id, product_id, variant_id, product_name, product_slug, image_url,
      sku, variant_name, size, color, price, quantity
    ) values (
      v_order.id,
      (v_line ->> 'product_id')::uuid,
      nullif(v_line ->> 'variant_id', '')::uuid,
      v_line ->> 'name',
      v_line ->> 'slug',
      v_line ->> 'image_url',
      v_line ->> 'sku',
      v_line ->> 'variant_name',
      v_line ->> 'size',
      v_line ->> 'color',
      (v_line ->> 'unit_price')::numeric,
      (v_line ->> 'quantity')::integer
    );

    if nullif(v_line ->> 'variant_id', '') is not null then
      update public.product_variants
      set stock_quantity = stock_quantity - (v_line ->> 'quantity')::integer
      where id = (v_line ->> 'variant_id')::uuid;
    else
      update public.products
      set stock_quantity = stock_quantity - (v_line ->> 'quantity')::integer
      where id = (v_line ->> 'product_id')::uuid;
    end if;

    update public.products
    set sales_count = sales_count + (v_line ->> 'quantity')::integer
    where id = (v_line ->> 'product_id')::uuid;
  end loop;

  if v_coupon_id is not null then
    insert into public.coupon_usage (coupon_id, user_id, order_id, email)
    values (v_coupon_id, p_user_id, v_order.id, lower(btrim(p_email)));
    update public.coupons set times_used = times_used + 1 where id = v_coupon_id;
  end if;

  insert into public.order_status_history (order_id, status, note)
  values (v_order.id, v_order.status, 'Order placed');

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'access_token', v_order.access_token,
    'total', v_order.total,
    'status', v_order.status
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Order lifecycle: history + restock on cancellation
-- ---------------------------------------------------------------------------
create or replace function public.orders_after_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status) values (new.id, new.status);

    if new.status = 'cancelled' and old.status not in ('cancelled', 'returned', 'refunded') then
      update public.product_variants v
      set stock_quantity = v.stock_quantity + s.qty
      from (
        select variant_id, sum(quantity)::integer as qty
        from public.order_items
        where order_id = new.id and variant_id is not null
        group by variant_id
      ) s
      where v.id = s.variant_id;

      update public.products p
      set stock_quantity = p.stock_quantity + s.qty
      from (
        select product_id, sum(quantity)::integer as qty
        from public.order_items
        where order_id = new.id and variant_id is null and product_id is not null
        group by product_id
      ) s
      where p.id = s.product_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger orders_after_status_change
  after update of status on public.orders
  for each row execute function public.orders_after_status_change();

-- ---------------------------------------------------------------------------
-- Catalogue search (SECURITY INVOKER: RLS limits results to active products)
-- ---------------------------------------------------------------------------
create or replace function public.search_products(
  p_query text default null,
  p_category_slugs text[] default null,
  p_collection_slugs text[] default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_availability text default null,
  p_sizes text[] default null,
  p_colors text[] default null,
  p_min_rating numeric default null,
  p_on_sale boolean default null,
  p_ids uuid[] default null,
  p_sort text default 'featured',
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (id uuid, total_count bigint)
language sql
stable
set search_path = public, extensions
as $$
  with target_categories as (
    select c.id
    from public.categories c
    where c.slug = any (p_category_slugs)
       or c.parent_id in (select c2.id from public.categories c2 where c2.slug = any (p_category_slugs))
  ),
  q as (
    select nullif(btrim(p_query), '') as term
  )
  select p.id, count(*) over () as total_count
  from public.products p
  left join public.categories c on c.id = p.category_id
  cross join q
  where p.status = 'active'
    and (q.term is null
      or p.name ilike '%' || public.escape_like(q.term) || '%'
      or p.short_description ilike '%' || public.escape_like(q.term) || '%'
      or c.name ilike '%' || public.escape_like(q.term) || '%'
      or extensions.similarity(p.name, q.term) > 0.3)
    and (p_category_slugs is null or p.category_id in (select id from target_categories))
    and (p_collection_slugs is null or exists (
      select 1 from public.product_collections pc
      join public.collections co on co.id = pc.collection_id
      where pc.product_id = p.id and co.slug = any (p_collection_slugs) and co.is_active
    ))
    and (p_min_price is null or p.price >= p_min_price)
    and (p_max_price is null or p.price <= p_max_price)
    and (p_availability is null
      or (p_availability = 'in_stock' and public.product_available_quantity(p.id) > 0)
      or (p_availability = 'out_of_stock' and public.product_available_quantity(p.id) = 0))
    and (p_sizes is null or exists (
      select 1 from public.product_variants v where v.product_id = p.id and v.size = any (p_sizes)
    ))
    and (p_colors is null or exists (
      select 1 from public.product_variants v where v.product_id = p.id and v.color = any (p_colors)
    ))
    and (p_min_rating is null or p.rating_avg >= p_min_rating)
    and (p_on_sale is not true or p.compare_at_price is not null)
    and (p_ids is null or p.id = any (p_ids))
  order by
    case when p_sort = 'price_asc' then p.price end asc nulls last,
    case when p_sort = 'price_desc' then p.price end desc nulls last,
    case when p_sort = 'best_selling' then p.sales_count end desc nulls last,
    case when p_sort = 'rating' then p.rating_avg end desc nulls last,
    case when p_sort = 'rating' then p.rating_count end desc nulls last,
    case when p_sort = 'featured' then p.featured end desc nulls last,
    p.created_at desc,
    p.id
  limit least(greatest(coalesce(p_limit, 24), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- Facets for the filter UI, scoped to the same base selection.
create or replace function public.catalog_facets(
  p_category_slugs text[] default null,
  p_collection_slugs text[] default null,
  p_query text default null,
  p_on_sale boolean default null
)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  with base as (
    select s.id from public.search_products(
      p_query => p_query,
      p_category_slugs => p_category_slugs,
      p_collection_slugs => p_collection_slugs,
      p_on_sale => p_on_sale,
      p_limit => 100
    ) s
  ),
  size_order(size, ord) as (
    values ('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5), ('XXL', 6), ('One Size', 7)
  )
  select jsonb_build_object(
    'sizes', coalesce((
      select jsonb_agg(x.size order by x.ord, x.size)
      from (
        select distinct v.size, coalesce(so.ord, 99) as ord
        from public.product_variants v
        join base b on b.id = v.product_id
        left join size_order so on so.size = v.size
        where v.size is not null
      ) x
    ), '[]'::jsonb),
    'colors', coalesce((
      select jsonb_agg(jsonb_build_object('name', x.color, 'hex', x.color_hex) order by x.color)
      from (
        select v.color, min(v.color_hex) as color_hex
        from public.product_variants v
        join base b on b.id = v.product_id
        where v.color is not null
        group by v.color
      ) x
    ), '[]'::jsonb),
    'price', (
      select jsonb_build_object('min', coalesce(min(p.price), 0), 'max', coalesce(max(p.price), 0))
      from public.products p join base b on b.id = p.id
    ),
    'collections', coalesce((
      select jsonb_agg(jsonb_build_object('slug', x.slug, 'name', x.name) order by x.position)
      from (
        select distinct co.slug, co.name, co.position
        from public.collections co
        join public.product_collections pc on pc.collection_id = co.id
        join base b on b.id = pc.product_id
        where co.is_active
      ) x
    ), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('slug', x.slug, 'name', x.name) order by x.position)
      from (
        select distinct c.slug, c.name, c.position
        from public.categories c
        join public.products p on p.category_id = c.id
        join base b on b.id = p.id
        where c.is_active
      ) x
    ), '[]'::jsonb)
  );
$$;

-- Instant search suggestions: products, categories and collections.
create or replace function public.search_catalog(p_query text, p_limit integer default 6)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  with q as (select nullif(btrim(p_query), '') as term)
  select jsonb_build_object(
    'products', coalesce((
      select jsonb_agg(x)
      from (
        select p.id, p.name, p.slug, p.price, p.compare_at_price,
               c.name as category_name,
               (select pi.url from public.product_images pi where pi.product_id = p.id order by pi.position limit 1) as image_url
        from public.products p
        left join public.categories c on c.id = p.category_id
        cross join q
        where p.status = 'active' and q.term is not null
          and (p.name ilike '%' || public.escape_like(q.term) || '%'
            or c.name ilike '%' || public.escape_like(q.term) || '%'
            or extensions.similarity(p.name, q.term) > 0.3)
        order by (p.name ilike public.escape_like(q.term) || '%') desc,
                 extensions.similarity(p.name, q.term) desc,
                 p.sales_count desc
        limit least(greatest(coalesce(p_limit, 6), 1), 20)
      ) x
    ), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('name', c.name, 'slug', c.slug))
      from (
        select c.name, c.slug from public.categories c cross join q
        where c.is_active and q.term is not null and c.name ilike '%' || public.escape_like(q.term) || '%'
        order by c.position limit 4
      ) c
    ), '[]'::jsonb),
    'collections', coalesce((
      select jsonb_agg(jsonb_build_object('name', co.name, 'slug', co.slug))
      from (
        select co.name, co.slug from public.collections co cross join q
        where co.is_active and q.term is not null and co.name ilike '%' || public.escape_like(q.term) || '%'
        order by co.position limit 4
      ) co
    ), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- Execution privileges
-- ---------------------------------------------------------------------------
revoke execute on function public.calculate_cart(jsonb, text, text, text, uuid, text, numeric) from public, anon, authenticated;
revoke execute on function public.place_order(uuid, text, text, jsonb, text, text, text, text, jsonb, jsonb, text, numeric, public.order_status) from public, anon, authenticated;
grant execute on function public.calculate_cart(jsonb, text, text, text, uuid, text, numeric) to service_role;
grant execute on function public.place_order(uuid, text, text, jsonb, text, text, text, text, jsonb, jsonb, text, numeric, public.order_status) to service_role;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.reviews_before_write() from public, anon, authenticated;
revoke execute on function public.refresh_product_rating() from public, anon, authenticated;
revoke execute on function public.orders_after_status_change() from public, anon, authenticated;

grant execute on function public.search_products(text, text[], text[], numeric, numeric, text, text[], text[], numeric, boolean, uuid[], text, integer, integer) to anon, authenticated, service_role;
grant execute on function public.catalog_facets(text[], text[], text, boolean) to anon, authenticated, service_role;
grant execute on function public.search_catalog(text, integer) to anon, authenticated, service_role;
grant execute on function public.product_available_quantity(uuid) to anon, authenticated, service_role;

-- ============================================================================
-- Admin reporting & order workflow checks (20261005000100_admin_reporting.sql).
-- Run against a seeded database after the migrations:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/admin_reporting.sql
-- Every block raises an exception on failure; the transaction is rolled back
-- at the end so the database is left unchanged.
--
-- Fixture: four orders placed in March 2031 (a window no other data uses),
-- timestamps in the store's time zone (Asia/Karachi, UTC+5):
--   A  hira (account)          1 unit   01 Mar 10:00   confirmed
--   B  guest.report@…          2 units  03 Mar 23:30   confirmed
--   C  hira (account)          1 unit   03 Mar 01:00   cancelled (= 02 Mar 20:00 UTC)
--   P  prev.report@… (guest)   1 unit   25 Feb 12:00   confirmed (previous period)
--   G  Hira.A@… as a guest     1 unit   01 Feb 12:00   confirmed (outside both periods;
--      credited to hira's account because the email matches)
-- ============================================================================
begin;

-- Fixture (as the database owner) ----------------------------------------------
do $$
declare
  v_product uuid;
  v_variant uuid;
  v_hira uuid := (select id from auth.users where email = 'hira.a@example.com');
  v_admin uuid := (select id from auth.users where email = 'sana.k@example.com');
  v_addr jsonb := '{"first_name":"Hira","last_name":"Ahmed","phone":"+923214567890","address_line_1":"House 24-B, Gulberg III","city":"Lahore","country":"PK"}';
  v_guest_addr jsonb := '{"first_name":"Report","last_name":"Guest","phone":"+923001112233","address_line_1":"1 Mall Road","city":"Lahore","country":"PK"}';
  v_a jsonb; v_b jsonb; v_c jsonb; v_p jsonb; v_g jsonb;
begin
  assert v_hira is not null and v_admin is not null, 'seeded customers missing';
  select p.id, v.id into v_product, v_variant
  from public.products p join public.product_variants v on v.product_id = p.id
  where p.slug = 'gul-e-nar' and v.stock_quantity >= 6
  order by v.stock_quantity desc limit 1;
  assert v_variant is not null, 'no gul-e-nar variant with stock';

  -- Sana becomes the admin for this test.
  update public.profiles set role = 'admin' where id = v_admin;

  v_a := public.place_order(v_hira, 'hira.a@example.com', '+923214567890',
    jsonb_build_array(jsonb_build_object('product_id', v_product, 'variant_id', v_variant, 'quantity', 1)),
    'standard', null, 'cod', 'cod', v_addr, v_addr, null, 0, 'confirmed');
  v_b := public.place_order(null, 'guest.report@example.com', '+923001112233',
    jsonb_build_array(jsonb_build_object('product_id', v_product, 'variant_id', v_variant, 'quantity', 2)),
    'standard', null, 'cod', 'cod', v_guest_addr, v_guest_addr, null, 0, 'confirmed');
  v_c := public.place_order(v_hira, 'hira.a@example.com', '+923214567890',
    jsonb_build_array(jsonb_build_object('product_id', v_product, 'variant_id', v_variant, 'quantity', 1)),
    'standard', null, 'cod', 'cod', v_addr, v_addr, null, 0, 'confirmed');
  v_p := public.place_order(null, 'prev.report@example.com', '+923001112233',
    jsonb_build_array(jsonb_build_object('product_id', v_product, 'variant_id', v_variant, 'quantity', 1)),
    'standard', null, 'cod', 'cod', v_guest_addr, v_guest_addr, null, 0, 'confirmed');

  v_g := public.place_order(null, 'Hira.A@example.com', '+923214567890',
    jsonb_build_array(jsonb_build_object('product_id', v_product, 'variant_id', v_variant, 'quantity', 1)),
    'standard', null, 'cod', 'cod', v_addr, v_addr, null, 0, 'confirmed');

  update public.orders set created_at = timestamptz '2031-02-01 12:00 Asia/Karachi' where id = (v_g ->> 'order_id')::uuid;
  update public.orders set created_at = timestamptz '2031-03-01 10:00 Asia/Karachi' where id = (v_a ->> 'order_id')::uuid;
  update public.orders set created_at = timestamptz '2031-03-03 23:30 Asia/Karachi' where id = (v_b ->> 'order_id')::uuid;
  update public.orders set created_at = timestamptz '2031-03-03 01:00 Asia/Karachi' where id = (v_c ->> 'order_id')::uuid;
  update public.orders set created_at = timestamptz '2031-02-25 12:00 Asia/Karachi' where id = (v_p ->> 'order_id')::uuid;
  update public.orders set status = 'cancelled' where id = (v_c ->> 'order_id')::uuid;

  perform set_config('test.product', v_product::text, false);
  perform set_config('test.variant', v_variant::text, false);
  perform set_config('test.hira', v_hira::text, false);
  perform set_config('test.admin', v_admin::text, false);
  perform set_config('test.order_a', v_a ->> 'order_id', false);
  perform set_config('test.order_b', v_b ->> 'order_id', false);
  perform set_config('test.order_c', v_c ->> 'order_id', false);
  perform set_config('test.order_g', v_g ->> 'order_id', false);
  perform set_config('test.number_a', v_a ->> 'order_number', false);
  perform set_config('test.total_a', v_a ->> 'total', false);
  perform set_config('test.total_b', v_b ->> 'total', false);
  perform set_config('test.total_p', v_p ->> 'total', false);
  perform set_config('test.pending_reviews', (select count(*) from public.reviews where status = 'pending')::text, false);
  perform set_config('test.low_stock', (
    (select count(*) from public.product_variants v join public.products p on p.id = v.product_id
     where p.status <> 'archived' and v.stock_quantity <= 3)
    + (select count(*) from public.products p where p.status <> 'archived' and p.stock_quantity <= 3
       and not exists (select 1 from public.product_variants v where v.product_id = p.id))
  )::text, false);
  perform set_config('test.open_orders', (select count(*) from public.orders where status in ('pending', 'confirmed', 'processing'))::text, false);
  perform set_config('test.customers_total', (
    (select count(*) from auth.users)
    + (select count(distinct lower(o.email::text)) from public.orders o
       where o.user_id is null and not exists (select 1 from auth.users u where lower(u.email) = lower(o.email::text)))
  )::text, false);
  raise notice 'ok: fixture';
end $$;

-- 1. anon is refused everything ------------------------------------------------
do $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    perform public.admin_dashboard_stats(now() - interval '7 days', now());
    raise exception 'anon ran admin_dashboard_stats';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_customers();
    raise exception 'anon ran admin_customers';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_update_order_status(current_setting('test.order_a')::uuid, 'shipped');
    raise exception 'anon ran admin_update_order_status';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.order_notes;
    raise exception 'anon read order_notes';
  exception when insufficient_privilege then null;
  end;
  raise notice 'ok: anon refused';
end $$;
reset role;

-- 2. A signed-in customer is refused every admin function ---------------------
do $$
declare
  v_order uuid := current_setting('test.order_a')::uuid;
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'authenticated', 'sub', current_setting('test.hira'))::text, true);
  set local role authenticated;

  begin
    perform public.admin_dashboard_stats(now() - interval '7 days', now());
    raise exception 'customer ran admin_dashboard_stats';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.admin_orders();
    raise exception 'customer ran admin_orders';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.admin_customers();
    raise exception 'customer ran admin_customers';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_customer(current_setting('test.hira')::uuid);
    raise exception 'customer ran admin_customer';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_update_order_status(v_order, 'shipped');
    raise exception 'customer changed an order status';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_update_order_payment(v_order, 'paid', 'X');
    raise exception 'customer changed a payment status';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_add_order_note(v_order, 'Sneaky');
    raise exception 'customer added an order note';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.order_notes (order_id, body) values (v_order, 'Sneaky');
    raise exception 'customer inserted an order note';
  exception when insufficient_privilege then null;
  end;
  -- RLS: a direct update matches no rows for a non-admin.
  update public.orders set status = 'delivered' where id = v_order;
  assert (select status from public.orders where id = v_order) = 'confirmed', 'customer updated their own order status';
  raise notice 'ok: customer refused';
end $$;
reset role;

-- 3. Admin: dashboard numbers ---------------------------------------------------
do $$
declare
  v_stats jsonb;
  v_day jsonb;
  v_top jsonb;
  v_total_a numeric := current_setting('test.total_a')::numeric;
  v_total_b numeric := current_setting('test.total_b')::numeric;
  v_total_p numeric := current_setting('test.total_p')::numeric;
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'authenticated', 'sub', current_setting('test.admin'))::text, true);
  set local role authenticated;

  v_stats := public.admin_dashboard_stats(
    timestamptz '2031-03-01 00:00 Asia/Karachi', timestamptz '2031-03-08 00:00 Asia/Karachi', 'Asia/Karachi', 3
  );

  -- Current period: A + B count as revenue; C (cancelled) counts as an order only.
  assert (v_stats -> 'current' ->> 'orders')::int = 3, format('orders: %s', v_stats -> 'current');
  assert (v_stats -> 'current' ->> 'revenue_orders')::int = 2, format('revenue orders: %s', v_stats -> 'current');
  assert (v_stats -> 'current' ->> 'revenue')::numeric = v_total_a + v_total_b, format('revenue: %s', v_stats -> 'current');
  assert (v_stats -> 'current' ->> 'customers')::int = 2, format('customers: %s', v_stats -> 'current');
  -- Previous period of the same length: P only.
  assert (v_stats -> 'previous' ->> 'orders')::int = 1, format('previous orders: %s', v_stats -> 'previous');
  assert (v_stats -> 'previous' ->> 'revenue')::numeric = v_total_p, format('previous revenue: %s', v_stats -> 'previous');
  assert (v_stats -> 'previous' ->> 'customers')::int = 1, 'previous customers';

  -- One row per local day; C (02 Mar 20:00 UTC) falls on 03 Mar in Karachi.
  assert jsonb_array_length(v_stats -> 'daily') = 7, format('daily length %s', jsonb_array_length(v_stats -> 'daily'));
  assert v_stats -> 'daily' -> 0 ->> 'day' = '2031-03-01', 'first day';
  assert v_stats -> 'daily' -> 6 ->> 'day' = '2031-03-07', 'last day';
  select d into v_day from jsonb_array_elements(v_stats -> 'daily') d where d ->> 'day' = '2031-03-01';
  assert (v_day ->> 'orders')::int = 1 and (v_day ->> 'revenue')::numeric = v_total_a, format('01 Mar: %s', v_day);
  select d into v_day from jsonb_array_elements(v_stats -> 'daily') d where d ->> 'day' = '2031-03-02';
  assert (v_day ->> 'orders')::int = 0, format('02 Mar should be empty (time zone bucketing): %s', v_day);
  select d into v_day from jsonb_array_elements(v_stats -> 'daily') d where d ->> 'day' = '2031-03-03';
  assert (v_day ->> 'orders')::int = 2 and (v_day ->> 'revenue')::numeric = v_total_b, format('03 Mar: %s', v_day);
  assert (select sum((d ->> 'revenue')::numeric) from jsonb_array_elements(v_stats -> 'daily') d) = v_total_a + v_total_b,
    'daily revenue must add up to the period revenue';

  assert (v_stats -> 'by_status' ->> 'confirmed')::int = 2 and (v_stats -> 'by_status' ->> 'cancelled')::int = 1,
    format('by_status: %s', v_stats -> 'by_status');

  v_top := v_stats -> 'top_by_revenue' -> 0;
  assert (v_top ->> 'product_id')::uuid = current_setting('test.product')::uuid, format('top product: %s', v_top);
  assert (v_top ->> 'units')::int = 3, format('top units (cancelled C excluded): %s', v_top);
  assert (v_top ->> 'revenue')::numeric = v_total_a + v_total_b, format('top revenue: %s', v_top);
  assert v_top ->> 'slug' = 'gul-e-nar', 'top product slug';
  assert jsonb_array_length(v_stats -> 'top_by_units') = 1, 'one product sold in the window';

  -- Store-wide counts match direct queries.
  assert (v_stats ->> 'pending_reviews')::int = current_setting('test.pending_reviews')::int, 'pending reviews';
  assert (v_stats ->> 'low_stock_count')::int = current_setting('test.low_stock')::int, 'low stock count';
  assert (v_stats ->> 'open_orders')::int = current_setting('test.open_orders')::int, 'open orders';
  assert jsonb_array_length(v_stats -> 'low_stock') <= 8, 'low stock list is capped';
  assert coalesce((select bool_and((l ->> 'stock')::int <= 3) from jsonb_array_elements(v_stats -> 'low_stock') l), true), 'low stock threshold';
  assert jsonb_array_length(v_stats -> 'recent_orders') between 1 and 6, 'recent orders';

  -- Invalid input is rejected.
  begin
    perform public.admin_dashboard_stats(now(), now() - interval '1 day');
    raise exception 'reversed range accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.admin_dashboard_stats(now() - interval '1 day', now(), 'Not/AZone');
    raise exception 'bad time zone accepted';
  exception when invalid_parameter_value then null;
  end;
  raise notice 'ok: dashboard';
end $$;
reset role;

-- 4. Admin: order search -----------------------------------------------------------
do $$
declare
  v_from timestamptz := timestamptz '2031-03-01 00:00 Asia/Karachi';
  v_to timestamptz := timestamptz '2031-03-08 00:00 Asia/Karachi';
  v_row record;
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'authenticated', 'sub', current_setting('test.admin'))::text, true);
  set local role authenticated;

  assert (select count(*) from public.admin_orders(p_from => v_from, p_to => v_to)) = 3, 'date window';
  assert (select max(total_count) from public.admin_orders(p_from => v_from, p_to => v_to, p_limit => 1)) = 3, 'total_count ignores the page size';
  assert (select count(*) from public.admin_orders(p_from => v_from, p_to => v_to, p_limit => 1)) = 1, 'page size';
  assert (select count(*) from public.admin_orders(p_from => v_from, p_to => v_to, p_status => 'cancelled')) = 1, 'status filter';
  assert (select count(*) from public.admin_orders(p_from => v_from, p_to => v_to, p_payment_status => 'paid')) = 0, 'payment filter';
  assert (select count(*) from public.admin_orders(p_query => 'GUEST.REPORT')) = 1, 'email search (case-insensitive)';
  assert (select count(*) from public.admin_orders(p_query => current_setting('test.number_a'))) = 1, 'order number search';
  assert (select count(*) from public.admin_orders(p_query => 'Report Guest', p_from => v_from, p_to => v_to)) = 1, 'name search, all words must match';
  assert (select count(*) from public.admin_orders(p_query => 'Report Nobody')) = 0, 'every word must match';
  assert (select count(*) from public.admin_orders(p_query => '%')) = 0, 'LIKE wildcards are literal';

  select * into v_row from public.admin_orders(p_from => v_from, p_to => v_to, p_sort => 'total_desc') limit 1;
  assert v_row.id = current_setting('test.order_b')::uuid, 'total_desc sort';
  assert v_row.item_count = 2 and v_row.customer_name = 'Report Guest', format('row: %s', v_row);
  select * into v_row from public.admin_orders(p_from => v_from, p_to => v_to, p_sort => 'oldest') limit 1;
  assert v_row.id = current_setting('test.order_a')::uuid, 'oldest sort';
  raise notice 'ok: order search';
end $$;
reset role;

-- 5. Admin: status workflow, payment, notes -------------------------------------
do $$
declare
  v_a uuid := current_setting('test.order_a')::uuid;
  v_b uuid := current_setting('test.order_b')::uuid;
  v_c uuid := current_setting('test.order_c')::uuid;
  v_variant uuid := current_setting('test.variant')::uuid;
  v_stock int;
  v_res jsonb;
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'authenticated', 'sub', current_setting('test.admin'))::text, true);
  set local role authenticated;

  -- Allowed move, with a customer-visible note on the history row.
  v_res := public.admin_update_order_status(v_a, 'shipped', 'Handed to TCS, tracking 7781', 'confirmed');
  assert v_res ->> 'previous_status' = 'confirmed' and v_res ->> 'status' = 'shipped', format('result %s', v_res);
  assert (select status from public.orders where id = v_a) = 'shipped', 'status not updated';
  assert (select note from public.order_status_history where order_id = v_a and status = 'shipped') = 'Handed to TCS, tracking 7781',
    'status note not recorded';

  -- Stale expectations, no-ops and backwards moves are refused.
  begin
    perform public.admin_update_order_status(v_a, 'delivered', null, 'confirmed');
    raise exception 'stale update accepted';
  exception when serialization_failure then null;
  end;
  begin
    perform public.admin_update_order_status(v_a, 'shipped');
    raise exception 'no-op accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.admin_update_order_status(v_a, 'cancelled');
    raise exception 'shipped order cancelled';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.admin_update_order_status(v_c, 'confirmed');
    raise exception 'order moved out of cancelled';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.admin_update_order_status(gen_random_uuid(), 'shipped');
    raise exception 'unknown order accepted';
  exception when no_data_found then null;
  end;
  begin
    perform public.admin_update_order_status(v_a, 'delivered', repeat('x', 501));
    raise exception 'long note accepted';
  exception when invalid_parameter_value then null;
  end;

  -- The same rules hold for a direct API update by an admin.
  begin
    update public.orders set status = 'pending' where id = v_a;
    raise exception 'direct backwards update accepted';
  exception when invalid_parameter_value then null;
  end;
  update public.orders set status = 'delivered' where id = v_a;
  assert (select status from public.orders where id = v_a) = 'delivered', 'direct allowed update failed';

  -- Cancelling restocks (orders_after_status_change).
  select stock_quantity into v_stock from public.product_variants where id = v_variant;
  perform public.admin_update_order_status(v_b, 'cancelled', null, 'confirmed');
  assert (select stock_quantity from public.product_variants where id = v_variant) = v_stock + 2, 'cancel did not restock';
  assert (select count(*) from public.order_status_history where order_id = v_b) = 2, 'history row missing';

  -- Payment: allowed move with reference, logged as an internal note.
  v_res := public.admin_update_order_payment(v_a, 'paid', '  TX-99812  ', 'pending');
  assert (select payment_status from public.orders where id = v_a) = 'paid', 'payment not updated';
  assert (select payment_reference from public.orders where id = v_a) = 'TX-99812', 'reference not trimmed/saved';
  assert (select count(*) from public.order_notes where order_id = v_a and kind = 'payment' and body like 'Payment marked paid%TX-99812') = 1,
    format('payment note missing: %s', (select array_agg(body) from public.order_notes where order_id = v_a));
  assert (select author_name from public.order_notes where order_id = v_a and kind = 'payment') = 'Sana Khan', 'author name';
  begin
    perform public.admin_update_order_payment(v_a, 'pending');
    raise exception 'paid -> pending accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.admin_update_order_payment(v_a, 'paid', 'TX-99812');
    raise exception 'unchanged payment accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    update public.orders set payment_status = 'failed' where id = v_a;
    raise exception 'direct paid -> failed accepted';
  exception when invalid_parameter_value then null;
  end;
  -- Reference-only change.
  perform public.admin_update_order_payment(v_a, 'paid', 'TX-99813', 'paid');
  assert (select payment_reference from public.orders where id = v_a) = 'TX-99813', 'reference-only change';

  -- Internal notes.
  v_res := public.admin_add_order_note(v_a, '  Customer asked for gift wrapping.  ');
  assert v_res ->> 'body' = 'Customer asked for gift wrapping.' and v_res ->> 'kind' = 'note', format('note: %s', v_res);
  assert (v_res ->> 'author_id')::uuid = current_setting('test.admin')::uuid, 'note author';
  begin
    perform public.admin_add_order_note(v_a, '   ');
    raise exception 'empty note accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.admin_add_order_note(v_a, repeat('x', 1001));
    raise exception 'long note accepted';
  exception when invalid_parameter_value then null;
  end;
  assert (select count(*) from public.order_notes where order_id = v_a) = 3, 'admin should read the notes';
  raise notice 'ok: order workflow';
end $$;
reset role;

-- Customers cannot see internal notes on their own order.
do $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'authenticated', 'sub', current_setting('test.hira'))::text, true);
  set local role authenticated;
  assert (select count(*) from public.orders where id = current_setting('test.order_a')::uuid) = 1, 'customer should see their order';
  assert (select count(*) from public.order_notes) = 0, 'customer saw internal notes';
  assert (select note from public.order_status_history where order_id = current_setting('test.order_a')::uuid and status = 'shipped')
    = 'Handed to TCS, tracking 7781', 'customer should see the status note';
  raise notice 'ok: notes are internal';
end $$;
reset role;

-- 6. Admin: customers ---------------------------------------------------------------
do $$
declare
  v_row record;
  v_detail jsonb;
  v_guest uuid;
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'authenticated', 'sub', current_setting('test.admin'))::text, true);
  set local role authenticated;

  assert (select max(total_count) from public.admin_customers(p_limit => 1)) = current_setting('test.customers_total')::int,
    'customers = accounts + guest emails';

  -- Guest B (cancelled above): one order, nothing spent.
  select * into v_row from public.admin_customers(p_query => 'guest.report');
  assert v_row.registered = false and v_row.role = 'guest', format('guest row: %s', v_row);
  assert v_row.order_count = 1 and v_row.total_spent = 0, format('guest stats: %s', v_row);
  assert v_row.first_name = 'Report' and v_row.last_name = 'Guest', 'guest name from the shipping address';
  v_guest := v_row.id;

  -- Hira: every order of hers counts; cancelled ones are not spent.
  select * into v_row from public.admin_customers(p_query => 'Hira Ahmed');
  assert v_row.id = current_setting('test.hira')::uuid and v_row.registered, format('hira row: %s', v_row);
  -- Her guest order G (same email, any case) is credited to her account.
  assert v_row.order_count = (
    select count(*) from public.orders
    where user_id = current_setting('test.hira')::uuid or (user_id is null and lower(email::text) = 'hira.a@example.com')
  ), format('hira order count: %s', v_row.order_count);
  assert v_row.total_spent = (
    select sum(total) from public.orders
    where (user_id = current_setting('test.hira')::uuid or (user_id is null and lower(email::text) = 'hira.a@example.com'))
      and status not in ('cancelled', 'returned', 'refunded')
  ), format('hira spent: %s', v_row.total_spent);
  assert (select count(*) from public.admin_customers(p_query => 'hira.a@example.com')) = 1, 'no separate guest row for an account email';
  assert v_row.last_order_at = timestamptz '2031-03-03 01:00 Asia/Karachi', format('hira last order: %s', v_row.last_order_at);

  -- Sorts
  select * into v_row from public.admin_customers(p_sort => 'last_order') limit 1;
  assert v_row.id = current_setting('test.hira')::uuid or v_row.id = v_guest, 'last_order sort';
  assert (select count(*) from public.admin_customers(p_query => 'nobody-matches-this')) = 0, 'empty search';

  -- Detail
  v_detail := public.admin_customer(current_setting('test.hira')::uuid);
  assert v_detail -> 'customer' ->> 'email' = 'hira.a@example.com', format('detail: %s', v_detail -> 'customer');
  assert (v_detail ->> 'order_count')::int = (
    select count(*) from public.orders
    where user_id = current_setting('test.hira')::uuid or (user_id is null and lower(email::text) = 'hira.a@example.com')
  ), 'detail orders';
  assert exists (select 1 from jsonb_array_elements(v_detail -> 'orders') o where (o ->> 'id')::uuid = current_setting('test.order_g')::uuid),
    'guest order with her email is listed';
  -- The guest id of her email resolves to her account.
  v_detail := public.admin_customer(md5('guest:hira.a@example.com')::uuid);
  assert (v_detail -> 'customer' ->> 'id')::uuid = current_setting('test.hira')::uuid, 'guest id of an account email';
  assert jsonb_typeof(v_detail -> 'addresses') = 'array', 'addresses array';
  assert (v_detail -> 'orders' -> 0 ->> 'id')::uuid = current_setting('test.order_c')::uuid, 'orders newest first';

  v_detail := public.admin_customer(v_guest);
  assert v_detail -> 'customer' ->> 'email' = 'guest.report@example.com' and (v_detail ->> 'order_count')::int = 1, format('guest detail: %s', v_detail);
  assert public.admin_customer(gen_random_uuid()) is null, 'unknown customer should be null';
  raise notice 'ok: customers';
end $$;
reset role;

rollback;

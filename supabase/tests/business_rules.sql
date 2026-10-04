-- ============================================================================
-- Database business-rule checks. Run against a freshly seeded database:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/business_rules.sql
-- Every block raises an exception on failure; the transaction is rolled back
-- at the end so the database is left unchanged.
-- ============================================================================
begin;

-- Helpers to impersonate PostgREST roles ------------------------------------
create or replace function pg_temp.as_anon() returns void language sql as $$
  select set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
$$;

-- 1. Pricing: server totals, sale prices, stock status ------------------------
do $$
declare
  v_var uuid;
  v_calc jsonb;
begin
  select v.id into v_var from public.product_variants v
  join public.products p on p.id = v.product_id
  where p.slug = 'gul-e-nar' and v.stock_quantity >= 2 limit 1;

  v_calc := public.calculate_cart(
    jsonb_build_array(jsonb_build_object('product_id', (select id from public.products where slug = 'gul-e-nar'), 'variant_id', v_var, 'quantity', 2)),
    'standard', null, 'PK', null, null, 0
  );
  assert (v_calc ->> 'subtotal')::numeric = 19900, format('subtotal wrong: %s', v_calc ->> 'subtotal');
  assert (v_calc ->> 'shipping')::numeric = 0, 'standard shipping should be free over Rs. 5,000';
  assert (v_calc ->> 'total')::numeric = 19900, 'total wrong';
  assert (v_calc -> 'lines' -> 0 ->> 'compare_at_price')::numeric = 12950, 'compare-at price missing';
  assert (v_calc ->> 'can_checkout')::boolean, 'cart should be checkout-able';
  raise notice 'ok: pricing';
end $$;

-- 2. Coupons: minimum order, percentage cap, invalid codes --------------------
do $$
declare
  v_items jsonb;
  v_calc jsonb;
begin
  select jsonb_build_array(jsonb_build_object('product_id', p.id, 'variant_id', v.id, 'quantity', 1))
  into v_items
  from public.products p join public.product_variants v on v.product_id = p.id
  where p.slug = 'mehrunisa' and v.stock_quantity > 0 limit 1;

  v_calc := public.calculate_cart(v_items, 'standard', 'welcome10', 'PK', null, 'new@example.com', 0);
  assert (v_calc -> 'coupon' ->> 'valid')::boolean, 'WELCOME10 should be valid (case-insensitive)';
  assert (v_calc ->> 'discount')::numeric = 3000, format('10%% of 58,000 capped at 3,000, got %s', v_calc ->> 'discount');

  v_calc := public.calculate_cart(v_items, 'standard', 'NOPE', 'PK', null, null, 0);
  assert not (v_calc -> 'coupon' ->> 'valid')::boolean, 'unknown coupon must be invalid';
  assert (v_calc ->> 'discount')::numeric = 0, 'invalid coupon must not discount';
  raise notice 'ok: coupons';
end $$;

-- 3. Order placement: snapshot, stock decrement, coupon usage -----------------
do $$
declare
  v_product uuid;
  v_var uuid;
  v_before int;
  v_res jsonb;
  v_order public.orders%rowtype;
begin
  select p.id, v.id, v.stock_quantity into v_product, v_var, v_before
  from public.products p join public.product_variants v on v.product_id = p.id
  where p.slug = 'afsana' and v.stock_quantity >= 1 limit 1;

  v_res := public.place_order(
    null, 'Guest@Example.com', '+92 300 1234567',
    jsonb_build_array(jsonb_build_object('product_id', v_product, 'variant_id', v_var, 'quantity', 1)),
    'standard', 'FESTIVE1500', 'cod', 'cod',
    '{"first_name":"A","last_name":"B","phone":"+923001234567","address_line_1":"1 Mall Road","city":"Lahore","country":"PK"}',
    '{"first_name":"A","last_name":"B","phone":"+923001234567","address_line_1":"1 Mall Road","city":"Lahore","country":"PK"}',
    null, 0, 'confirmed'
  );
  select * into v_order from public.orders where id = (v_res ->> 'order_id')::uuid;
  assert v_order.total = 45000 - 1500, format('order total wrong: %s', v_order.total);
  assert v_order.email = 'guest@example.com', 'email should be normalised';
  assert v_order.order_number like 'AQ-%', 'order number format';
  assert (select stock_quantity from public.product_variants where id = v_var) = v_before - 1, 'stock not decremented';
  assert (select count(*) from public.coupon_usage where order_id = v_order.id) = 1, 'coupon usage not recorded';
  assert (select product_name from public.order_items where order_id = v_order.id) = 'Afsana', 'snapshot missing';

  -- Cancelling restocks
  update public.orders set status = 'cancelled' where id = v_order.id;
  assert (select stock_quantity from public.product_variants where id = v_var) = v_before, 'cancel did not restock';
  assert (select count(*) from public.order_status_history where order_id = v_order.id) = 2, 'history not recorded';
  raise notice 'ok: place_order';
end $$;

-- 4. Overselling is refused -----------------------------------------------------
do $$
declare
  v_product uuid;
  v_var uuid;
  v_stock int;
begin
  select p.id, v.id, v.stock_quantity into v_product, v_var, v_stock
  from public.products p join public.product_variants v on v.product_id = p.id
  where p.slug = 'neelofar' and v.stock_quantity > 0 limit 1;
  begin
    perform public.place_order(
      null, 'x@example.com', null,
      jsonb_build_array(jsonb_build_object('product_id', v_product, 'variant_id', v_var, 'quantity', v_stock + 1)),
      'standard', null, 'cod', 'cod', '{"country":"PK"}', '{"country":"PK"}'
    );
    raise exception 'expected CART_INVALID';
  exception when others then
    assert sqlerrm = 'CART_INVALID', format('unexpected error: %s', sqlerrm);
  end;
  -- Sold-out product
  begin
    perform public.place_order(
      null, 'x@example.com', null,
      (select jsonb_build_array(jsonb_build_object('product_id', p.id, 'variant_id', v.id, 'quantity', 1))
       from public.products p join public.product_variants v on v.product_id = p.id where p.slug = 'saba' limit 1),
      'standard', null, 'cod', 'cod', '{"country":"PK"}', '{"country":"PK"}'
    );
    raise exception 'expected CART_INVALID for sold out';
  exception when others then
    assert sqlerrm = 'CART_INVALID', format('unexpected error: %s', sqlerrm);
  end;
  raise notice 'ok: oversell protection';
end $$;

-- 5. RLS: anonymous visitors --------------------------------------------------
select pg_temp.as_anon();
do $$
begin
  assert (select count(*) from public.products) = 24, 'anon should see active products';
  assert (select count(*) from public.coupons) = 0, 'anon must not read coupons';
  assert (select count(*) from public.orders) = 0, 'anon must not read orders';
  assert (select count(*) from public.newsletter_subscribers) = 0, 'anon must not read subscribers';
  begin
    perform public.calculate_cart('[]'::jsonb);
    raise exception 'anon executed calculate_cart';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.newsletter_subscribers (email) values ('spam@example.com');
    raise exception 'anon inserted subscriber';
  exception when insufficient_privilege then null;
  end;
  assert jsonb_array_length(public.search_catalog('mehtab') -> 'products') = 1, 'search_catalog failed';
  assert (select count(*) from public.search_products(p_category_slugs => array['ready-to-wear'])) > 0, 'category search failed';
  raise notice 'ok: anon RLS';
end $$;
reset role;

-- 6. RLS: authenticated customer ---------------------------------------------
do $$
declare
  v_user uuid := (select id from auth.users where email = 'hira.a@example.com');
  v_other uuid := (select id from auth.users where email = 'sana.k@example.com');
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'authenticated', 'sub', v_user)::text, true);
  set local role authenticated;

  assert (select count(*) from public.orders) = 1, 'customer should see exactly their own order';
  assert (select count(*) from public.orders where user_id = v_other) = 0, 'customer saw another user''s orders';

  -- Cannot escalate role
  begin
    update public.profiles set role = 'admin' where id = v_user;
    raise exception 'role escalation allowed';
  exception when insufficient_privilege then null;
  end;

  -- Review: cannot self-approve; unverified review goes to moderation
  insert into public.reviews (product_id, user_id, rating, title, content)
  values ((select id from public.products where slug = 'rubaab'), v_user, 5, 'Lovely', 'Beautiful piece, highly recommend it.');
  assert (select status from public.reviews where user_id = v_user and product_id = (select id from public.products where slug = 'rubaab')) = 'pending',
    'unverified review should be pending';

  -- Duplicate review for same product is rejected
  begin
    insert into public.reviews (product_id, user_id, rating, title, content)
    values ((select id from public.products where slug = 'rubaab'), v_user, 4, 'Again', 'Trying to review twice here.');
    raise exception 'duplicate review allowed';
  exception when unique_violation then null;
  end;

  -- Cannot write a review as someone else
  begin
    insert into public.reviews (product_id, user_id, rating, title, content)
    values ((select id from public.products where slug = 'laila'), v_other, 1, 'Fake', 'Writing as another customer.');
    raise exception 'impersonated review allowed';
  exception when insufficient_privilege then null;
  end;

  -- Wishlist is private
  insert into public.wishlists (user_id, product_id) values (v_user, (select id from public.products where slug = 'laila'));
  begin
    insert into public.wishlists (user_id, product_id) values (v_other, (select id from public.products where slug = 'laila'));
    raise exception 'wrote to another user''s wishlist';
  exception when insufficient_privilege then null;
  end;

  -- Cannot create orders directly
  begin
    insert into public.orders (email, payment_method, subtotal, total, shipping_address, billing_address)
    values ('x@example.com', 'cod', 0, 0, '{}', '{}');
    raise exception 'customer inserted an order';
  exception when insufficient_privilege then null;
  end;
  raise notice 'ok: customer RLS';
end $$;
reset role;

rollback;

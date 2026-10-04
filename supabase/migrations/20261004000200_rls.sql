-- ============================================================================
-- Row Level Security
--   * Shoppers can read published catalogue data and approved reviews.
--   * Authenticated users can only touch their own profile, wishlist, cart,
--     addresses, reviews and orders.
--   * Orders, coupons, newsletter and guest carts are written exclusively by
--     server code using the service role (which bypasses RLS) or by
--     SECURITY DEFINER functions that are not executable by end users.
--   * Admin access is decided in the database (profiles.role), never in the UI.
-- ============================================================================

-- Admin check used by policies. SECURITY DEFINER so it can read profiles
-- regardless of the caller's own RLS visibility.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_collections enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.reviews enable row level security;
alter table public.review_images enable row level security;
alter table public.wishlists enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.shipping_methods enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.coupon_usage enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.pages enable row level security;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create policy "Users read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Users update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Admins manage profiles" on public.profiles
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Customers may edit their details but never their role.
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, phone, avatar_url) on public.profiles to authenticated;
revoke insert, delete on public.profiles from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Catalogue (public read of published rows; admin write)
-- ---------------------------------------------------------------------------
create policy "Public reads active categories" on public.categories
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "Admins manage categories" on public.categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Public reads active collections" on public.collections
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "Admins manage collections" on public.collections
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Public reads active products" on public.products
  for select to anon, authenticated using (status = 'active' or (select public.is_admin()));
create policy "Admins manage products" on public.products
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Public reads images of active products" on public.product_images
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
    or (select public.is_admin())
  );
create policy "Admins manage product images" on public.product_images
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Public reads variants of active products" on public.product_variants
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
    or (select public.is_admin())
  );
create policy "Admins manage variants" on public.product_variants
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Public reads product collections" on public.product_collections
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
    or (select public.is_admin())
  );
create policy "Admins manage product collections" on public.product_collections
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Public reads active shipping methods" on public.shipping_methods
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "Admins manage shipping methods" on public.shipping_methods
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Public reads published pages" on public.pages
  for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "Admins manage pages" on public.pages
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
create policy "Public reads approved reviews" on public.reviews
  for select to anon, authenticated using (
    status = 'approved' or user_id = (select auth.uid()) or (select public.is_admin())
  );

create policy "Users write own reviews" on public.reviews
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
  );

create policy "Users edit own reviews" on public.reviews
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users delete own reviews" on public.reviews
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Admins moderate reviews" on public.reviews
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- verified_purchase, status and author_name are server-controlled
-- (see reviews_before_write trigger); customers can only set content.
revoke insert, update on public.reviews from authenticated;
grant insert (product_id, user_id, rating, title, content) on public.reviews to authenticated;
-- status is included so admins can moderate; the trigger re-derives it for customers.
grant update (rating, title, content, status) on public.reviews to authenticated;
revoke insert, update, delete on public.reviews from anon;

create policy "Public reads images of visible reviews" on public.review_images
  for select to anon, authenticated using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and (r.status = 'approved' or r.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );
create policy "Users attach images to own reviews" on public.review_images
  for insert to authenticated with check (
    exists (select 1 from public.reviews r where r.id = review_id and r.user_id = (select auth.uid()))
  );
create policy "Users delete images of own reviews" on public.review_images
  for delete to authenticated using (
    exists (select 1 from public.reviews r where r.id = review_id and r.user_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- Wishlist, cart, addresses — strictly owner-only
-- ---------------------------------------------------------------------------
create policy "Users manage own wishlist" on public.wishlists
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users manage own cart" on public.carts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users manage own cart items" on public.cart_items
  for all to authenticated
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));

create policy "Users manage own addresses" on public.addresses
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Orders — customers read their own; nobody writes from the client.
-- ---------------------------------------------------------------------------
create policy "Users read own orders" on public.orders
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins update orders" on public.orders
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Users read own order items" on public.order_items
  for select to authenticated using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

create policy "Users read own order history" on public.order_status_history
  for select to authenticated using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

revoke insert, update, delete on public.orders, public.order_items, public.order_status_history
  from anon, authenticated;
-- Admins update order status through the policy above.
grant update (status, payment_status, payment_reference, notes) on public.orders to authenticated;

-- ---------------------------------------------------------------------------
-- Coupons, coupon usage, newsletter — server only (service role) + admins
-- ---------------------------------------------------------------------------
create policy "Admins manage coupons" on public.coupons
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins read coupon usage" on public.coupon_usage
  for select to authenticated using ((select public.is_admin()));

create policy "Admins read subscribers" on public.newsletter_subscribers
  for select to authenticated using ((select public.is_admin()));

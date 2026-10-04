-- ============================================================================
-- AURAQ storefront — core schema
-- Tables, enums, constraints, indexes and housekeeping triggers.
-- RLS policies live in 20261004000200_rls.sql, business functions in
-- 20261004000300_functions.sql, storage in 20261004000400_storage.sql.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'admin');
create type public.product_status as enum ('draft', 'active', 'archived');
create type public.review_status as enum ('pending', 'approved', 'rejected');
create type public.order_status as enum (
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'
);
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.coupon_type as enum ('percentage', 'fixed');
create type public.subscriber_status as enum ('subscribed', 'unsubscribed');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Slugs: lowercase words separated by single hyphens.
create domain public.slug as text
  check (value ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(value) <= 120);

create domain public.money as numeric(12, 2)
  check (value >= 0);

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text check (char_length(first_name) <= 80),
  last_name text check (char_length(last_name) <= 80),
  phone text check (char_length(phone) <= 32),
  avatar_url text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  slug public.slug not null,
  description text,
  image_url text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint categories_slug_key unique (slug),
  constraint categories_not_own_parent check (parent_id is distinct from id)
);
create index categories_parent_idx on public.categories (parent_id);
create index categories_active_position_idx on public.categories (is_active, position);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug public.slug not null,
  description text,
  image_url text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint collections_slug_key unique (slug)
);
create index collections_active_position_idx on public.collections (is_active, position);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null check (char_length(name) between 1 and 160),
  slug public.slug not null,
  short_description text check (char_length(short_description) <= 300),
  description text,
  price public.money not null,
  compare_at_price public.money,
  sku text not null check (char_length(sku) between 1 and 64),
  -- Used only when a product has no variants; otherwise stock lives on variants.
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  status public.product_status not null default 'draft',
  featured boolean not null default false,
  material text,
  care_instructions text,
  -- [{ "label": "Shirt", "value": "Embroidered organza, 2.5m" }, ...]
  details jsonb not null default '[]'::jsonb check (jsonb_typeof(details) = 'array'),
  -- Denormalised aggregates, maintained by triggers / place_order().
  rating_avg numeric(3, 2) not null default 0 check (rating_avg between 0 and 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  sales_count integer not null default 0 check (sales_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_key unique (slug),
  constraint products_sku_key unique (sku),
  constraint products_compare_gt_price check (compare_at_price is null or compare_at_price > price)
);
create index products_category_idx on public.products (category_id);
create index products_status_created_idx on public.products (status, created_at desc);
create index products_status_price_idx on public.products (status, price);
create index products_featured_idx on public.products (featured) where status = 'active';
create index products_sales_idx on public.products (sales_count desc) where status = 'active';
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_collections (
  product_id uuid not null references public.products (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  position integer not null default 0,
  primary key (product_id, collection_id)
);
create index product_collections_collection_idx on public.product_collections (collection_id, position);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt_text text check (char_length(alt_text) <= 200),
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, position);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  sku text not null check (char_length(sku) between 1 and 64),
  size text check (char_length(size) <= 24),
  color text check (char_length(color) <= 40),
  color_hex text check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  -- Null = inherit products.price
  price public.money,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_variants_sku_key unique (sku),
  constraint product_variants_option_key unique nulls not distinct (product_id, size, color)
);
create index product_variants_product_idx on public.product_variants (product_id, position);
create index product_variants_size_idx on public.product_variants (size);
create index product_variants_color_idx on public.product_variants (color);

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text not null check (char_length(title) between 2 and 120),
  content text not null check (char_length(content) between 10 and 2000),
  -- Snapshot of the display name at time of writing ("Hira A.")
  author_name text not null default 'Customer' check (char_length(author_name) <= 80),
  verified_purchase boolean not null default false,
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One review per customer per product; edits update the existing row.
  constraint reviews_one_per_user unique (product_id, user_id)
);
create index reviews_product_status_idx on public.reviews (product_id, status, created_at desc);
create index reviews_user_idx on public.reviews (user_id);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create table public.review_images (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  image_url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index review_images_review_idx on public.review_images (review_id, position);

-- ---------------------------------------------------------------------------
-- Wishlist, cart, addresses
-- ---------------------------------------------------------------------------
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint wishlists_user_product_key unique (user_id, product_id)
);
create index wishlists_user_idx on public.wishlists (user_id, created_at desc);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  -- Opaque random id stored in an httpOnly cookie for guest carts.
  session_id text check (char_length(session_id) between 32 and 128),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_user_key unique (user_id),
  constraint carts_session_key unique (session_id),
  constraint carts_owner_present check (user_id is not null or session_id is not null)
);

create trigger carts_set_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  quantity integer not null check (quantity between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_line_key unique nulls not distinct (cart_id, product_id, variant_id)
);
create index cart_items_cart_idx on public.cart_items (cart_id);

create trigger cart_items_set_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  phone text not null check (char_length(phone) between 7 and 32),
  address_line_1 text not null check (char_length(address_line_1) between 3 and 200),
  address_line_2 text check (char_length(address_line_2) <= 200),
  city text not null check (char_length(city) between 2 and 80),
  province text check (char_length(province) <= 80),
  postal_code text check (char_length(postal_code) <= 16),
  -- ISO 3166-1 alpha-2
  country text not null default 'PK' check (country ~ '^[A-Z]{2}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);
create unique index addresses_one_default_per_user on public.addresses (user_id) where is_default;

create trigger addresses_set_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Shipping, coupons
-- ---------------------------------------------------------------------------
create table public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  code public.slug not null,
  name text not null,
  description text,
  price public.money not null,
  -- Order value (after discount) at which this method becomes free.
  free_shipping_threshold public.money,
  min_days integer not null default 2 check (min_days >= 0),
  max_days integer not null default 5,
  -- Null = available for every destination country.
  countries text[],
  is_active boolean not null default true,
  position integer not null default 0,
  constraint shipping_methods_code_key unique (code),
  constraint shipping_methods_days check (max_days >= min_days)
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code extensions.citext not null check (char_length(code) between 3 and 32),
  description text,
  type public.coupon_type not null,
  value numeric(12, 2) not null check (value > 0),
  minimum_order public.money not null default 0,
  maximum_discount public.money,
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit integer check (usage_limit > 0),
  usage_limit_per_customer integer check (usage_limit_per_customer > 0),
  times_used integer not null default 0 check (times_used >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint coupons_code_key unique (code),
  constraint coupons_percentage_range check (type <> 'percentage' or value <= 100),
  constraint coupons_window check (expires_at is null or starts_at is null or expires_at > starts_at)
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create sequence public.order_number_seq start with 100001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  order_number text not null default ('AQ-' || nextval('public.order_number_seq')::text),
  -- Unguessable token for guest order look-ups (confirmation page / emails).
  access_token uuid not null default gen_random_uuid(),
  email extensions.citext not null,
  phone text,
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'pending',
  payment_method text not null,
  payment_provider text,
  payment_reference text,
  shipping_method text,
  shipping_method_name text,
  subtotal public.money not null,
  discount public.money not null default 0,
  shipping_cost public.money not null default 0,
  tax public.money not null default 0,
  total public.money not null,
  currency char(3) not null default 'PKR',
  coupon_code text,
  shipping_address jsonb not null check (jsonb_typeof(shipping_address) = 'object'),
  billing_address jsonb not null check (jsonb_typeof(billing_address) = 'object'),
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_order_number_key unique (order_number),
  constraint orders_access_token_key unique (access_token),
  constraint orders_discount_lte_subtotal check (discount <= subtotal),
  constraint orders_total_matches check (total = subtotal - discount + shipping_cost + tax)
);
create index orders_user_created_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status);
create index orders_email_idx on public.orders (email);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  -- Snapshots: historic orders stay correct when the catalogue changes.
  product_name text not null,
  product_slug text,
  image_url text,
  sku text not null,
  variant_name text,
  size text,
  color text,
  price public.money not null,
  quantity integer not null check (quantity > 0),
  line_total numeric(12, 2) generated always as (price * quantity) stored
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  note text,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

create table public.coupon_usage (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  order_id uuid not null references public.orders (id) on delete cascade,
  email extensions.citext,
  created_at timestamptz not null default now(),
  constraint coupon_usage_order_key unique (order_id)
);
create index coupon_usage_coupon_user_idx on public.coupon_usage (coupon_id, user_id);
create index coupon_usage_coupon_email_idx on public.coupon_usage (coupon_id, email);

-- ---------------------------------------------------------------------------
-- Content & marketing
-- ---------------------------------------------------------------------------
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email extensions.citext not null check (char_length(email) <= 254),
  status public.subscriber_status not null default 'subscribed',
  source text check (char_length(source) <= 40),
  created_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_key unique (email)
);

-- Editable long-form pages (policies). Content is Markdown.
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug public.slug not null,
  title text not null,
  summary text,
  content text not null default '',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pages_slug_key unique (slug)
);

create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

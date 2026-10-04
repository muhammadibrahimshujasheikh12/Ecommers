# AURAQ — Premium Pakistani Fashion Storefront

A production-ready e-commerce storefront for a premium Pakistani women's fashion label, built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS v4** and **Supabase** (Postgres, Auth, Storage).

**No Supabase account yet?** Just run `npm install && npm run dev`. With no Supabase settings the store starts in [demo mode](#demo-mode-no-supabase-needed) with 64 sample products, and every page works.

> **AURAQ** is a placeholder brand name. Brand copy, navigation and contact details live in [`src/content/`](src/content).

The homepage design system and static prototype that this app was built from are in [`design/`](design) — see [`design/README.md`](design/README.md).

---

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Demo mode (no Supabase needed)](#demo-mode-no-supabase-needed)
4. [Quick start with Supabase (local)](#quick-start-with-supabase-local)
5. [Environment variables](#environment-variables)
6. [Supabase project setup (hosted)](#supabase-project-setup-hosted)
7. [Running the store without an admin UI](#running-the-store-without-an-admin-ui)
8. [Payments](#payments)
9. [Architecture](#architecture)
10. [Security model](#security-model)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Customisation](#customisation)
14. [Known limitations](#known-limitations)

---

## Features

**Storefront**
- Home: hero slider (pausable, reduced-motion aware), featured collections, categories, new arrivals, editorial banner, shop-the-look hotspots, best sellers, spotlight, watch & shop, customer reviews, services, gallery, newsletter.
- Sticky header with accessible mega menus (hover or keyboard focus), mobile drawer navigation and a search overlay with live suggestions.
- `/shop`, `/category/[slug]` and `/collections/[slug]` share URL-driven filters (category, collection, size, colour, price, rating, availability, sale), sorting and pagination. The filters are optimistic and share-able, and drop into a drawer on mobile.
- Product pages: zoomable gallery with lightbox, size and colour variants with live stock, size guide, sticky mobile purchase bar, Buy Now, related and recently-viewed products, and Product JSON-LD.
- Reviews: only signed-in customers can review, one review per customer per product. Verified purchasers publish instantly; other reviews are moderated. Photos are optional (Supabase Storage).
- Compare up to 4 products. The wishlist is stored in Supabase for signed-in users and in `localStorage` for guests, and the two merge on sign-in.
- Cart drawer and `/cart` page. Totals, coupons, shipping and stock are always priced by the database.
- Four-step checkout (information → shipping → payment → review) with guest checkout, saved addresses and a live server quote. Orders are placed atomically, with inventory locking.
- Order confirmation page, guest order tracking (order number + email), and an account area: dashboard, orders with status timeline, address book, profile and password.
- Auth: register, login, forgot and reset password, email verification, session refresh in `src/proxy.ts`.
- Editable policy pages, written in Markdown in the `pages` table: privacy, returns, shipping, cancellation, terms, FAQs, contact.

**Quality**
- Responsive from 390px to 1440px+. Keyboard and screen-reader accessible: native `<dialog>`, focus management, skip link, labelled controls. The axe-core audits pass.
- SEO: per-page metadata, canonical URLs, Open Graph, `sitemap.xml`, `robots.txt`, and JSON-LD (Organization, WebSite, BreadcrumbList, Product).
- Performance: Server Components by default, cached catalogue reads with tag revalidation, `next/image` (AVIF/WebP), self-hosted fonts, and minimal client JavaScript.
- Loading, empty, error and not-found states throughout. Subtle animations that respect `prefers-reduced-motion`.

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (`@theme` tokens in `src/app/globals.css`) |
| Database | Supabase Postgres: RLS, SQL functions for pricing, checkout and search |
| Auth | Supabase Auth via `@supabase/ssr` (cookie sessions) |
| Storage | Supabase Storage (`product-images`, `review-images`) |
| Forms | React Hook Form + Zod (the same schemas validate on the server) |
| Icons | Lucide |
| Tests | Playwright end-to-end, SQL business-rule tests |

## Demo mode (no Supabase needed)

```bash
npm install
npm run dev                # http://localhost:3000
```

When `NEXT_PUBLIC_SUPABASE_URL` is not set, or `NEXT_PUBLIC_DEMO_MODE=true`, the store runs entirely on the bundled sample catalogue in [`src/lib/demo/dataset.json`](src/lib/demo/dataset.json). It is generated from the same source as the database seed, so the demo and a real Supabase project show the same products.

What works in demo mode:
- **Catalogue:** 64 products across every category and collection, with search, filters, sorting, product pages, reviews, compare and wishlist.
- **Bag and checkout:** server-side pricing with coupons and shipping. Cash-on-delivery orders get a confirmation page and can be tracked at `/track-order`. A notice explains that no real order or payment is made.
- **Accounts:** sign in with **any email and password**; nothing is checked or stored. Sign in as `hira.a@example.com` to see a customer with order history. The profile, address book, wishlist and reviews all work.
- **Policy pages:** FAQs and the policy pages.

**How it works:** catalogue data is read-only. Each visitor's bag, demo account, addresses, orders, wishlist and reviews are kept in small httpOnly cookies in their own browser. So it works on any host (including Vercel) without a database, and nothing is shared between visitors. Older demo orders roll off once the cookie is full (about the last 2–3 orders). Stock never runs down. Review photos and emails are off.

**Deploy a demo:** import the repo into Vercel and deploy with no environment variables. Set `NEXT_PUBLIC_SITE_URL` to the deployed URL for correct canonical links.

**Switch to a real store:** create a Supabase project, set the variables below and redeploy. Demo mode switches off by itself.

## Quick start with Supabase (local)

Requirements: Node ≥ 20.9, Docker, and the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
npm install

# 1. Start Supabase locally. This applies supabase/migrations and supabase/seed.sql.
supabase start
supabase db reset          # re-run migrations + seed at any time

# 2. Configure the app
cp .env.example .env.local
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from `supabase status`>
#   SUPABASE_SERVICE_ROLE_KEY=<service_role key from `supabase status`>
#   NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 3. Run
npm run dev                # http://localhost:3000
```

Local auth emails (password reset, email change) are caught by the local mail viewer at http://localhost:54324. Email confirmation is **off** locally, so sign-up signs you straight in. Turn it on for hosted projects (see below).

**Demo data:** the seed adds 64 products across categories and collections, shipping methods, policy pages, 73 sample reviews and orders, and two coupons (these also work in demo mode):

| Code | Rule |
| --- | --- |
| `WELCOME10` | 10% off orders over Rs. 5,000 (max Rs. 3,000), once per customer |
| `FESTIVE1500` | Rs. 1,500 off orders over Rs. 15,000, until 31 Dec 2026 |

With Supabase, the seeded demo customers have no password and cannot sign in, so register a new account to try the account area. In both modes, seeded order `AQ-100001` can be tracked at `/track-order` with `hira.a@example.com`.

## Environment variables

See [`.env.example`](.env.example).

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL. Leave it unset to run in demo mode. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Anon / publishable key. All access through it is limited by RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Used by server code for pricing, checkout, guest order lookup and the newsletter. Never prefix it with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_DEMO_MODE` | public | `true` forces demo mode even when Supabase is configured. NEXT_PUBLIC values are fixed at build time, so rebuild after changing it. |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical origin for metadata, the sitemap and auth email redirects |
| `PAYMENT_METHODS` | server | Comma-separated payment methods offered at checkout: `cod`, `bank_transfer` |
| `BANK_TRANSFER_ACCOUNT_TITLE`, `BANK_TRANSFER_BANK_NAME`, `BANK_TRANSFER_IBAN` | server | Bank transfer is offered only when an IBAN is set |
| `TAX_RATE` | server | Tax added on top of prices, e.g. `0.05`. `0` means prices are tax-inclusive. |
| `GUEST_CHECKOUT_ENABLED` | server | `false` requires an account to check out |
| `NEXT_PUBLIC_REVIEW_IMAGES_ENABLED` | public | Lets reviewers attach up to 3 photos |
| `REVALIDATE_SECRET` | server | Bearer token for `POST /api/revalidate` |

`src/lib/env.ts` and `src/lib/env.server.ts` validate the variables with Zod. The server file imports `server-only`, so the build fails if a client component ever imports it.

## Supabase project setup (hosted)

1. **Create a project** at [supabase.com](https://supabase.com), then link it and push the schema:
   ```bash
   supabase link --project-ref <project-ref>
   supabase db push                         # applies supabase/migrations/*
   psql "<connection string>" -f supabase/seed.sql   # optional demo catalogue
   ```
   The migrations create:
   - `…100_schema.sql`: tables, enums, constraints, indexes, triggers.
   - `…200_rls.sql`: row-level security and column privileges.
   - `…300_functions.sql`: `calculate_cart`, `place_order`, search, facets, rating aggregation, stock restoration.
   - `…400_storage.sql`: buckets and storage policies.

2. **Authentication → URL configuration**
   - Site URL: `https://your-domain`
   - Redirect URLs: `https://your-domain/auth/confirm` (plus `http://localhost:3000/auth/confirm` for local work)

3. **Authentication → Providers → Email:** enable **Confirm email**.

4. **Authentication → Email templates:** paste the templates from [`supabase/templates/`](supabase/templates). They link to `/auth/confirm?token_hash=…&type=…`, which the app verifies on the server. This works across devices and browsers, unlike the default PKCE links.
   - *Confirm signup*: `confirmation.html`
   - *Reset password*: `recovery.html`
   - *Change email address*: `email-change.html`

5. **Authentication → SMTP:** configure a real SMTP provider for production. Supabase's built-in sender is rate-limited and meant for testing.

6. **Storage:** the `product-images` and `review-images` buckets are created by the migration. Check that both exist and are public.

7. **Make yourself an admin.** Sign up through the site, then run in the SQL editor:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
   Admin rights are enforced by RLS (`public.is_admin()`) in the database, never by client-side checks.

8. **Cache revalidation (recommended).** Catalogue and page reads are cached. Set `REVALIDATE_SECRET`, then add a **Database Webhook** (Database → Webhooks) on insert, update and delete for `products`, `product_variants`, `product_images`, `categories`, `collections`, `product_collections` and `pages`:
   - Method `POST`, URL `https://your-domain/api/revalidate`
   - Header `Authorization: Bearer <REVALIDATE_SECRET>`

   Without the webhook, changes appear within 5 minutes. Stock and prices in the cart and at checkout are always read live.

9. **Regenerate types** after any schema change: `npm run db:types`. This needs a linked or local project; use `--project-id` for hosted.

## Running the store without an admin UI

This release has no admin dashboard. Admins manage the store in the Supabase dashboard (Table Editor / SQL), which runs under the same RLS rules.

| Task | How |
| --- | --- |
| Add a product | Insert into `products` (with `status = 'active'`), then add one `product_variants` row per size/colour with `stock_quantity` and a unique `sku`, and `product_images` rows. Link collections in `product_collections`. |
| Product photos | Upload to the `product-images` bucket. Set `product_images.url` to the file's public URL; relative `/images/...` paths also work. Always fill in `alt_text`. |
| Stock | Edit `product_variants.stock_quantity`. Checkout locks the variant rows (`FOR UPDATE`) and fails cleanly if stock has run out. |
| Orders | Update `orders.status`: `pending → confirmed → processing → shipped → delivered`, or `cancelled` / `returned` / `refunded`. Every change is recorded in `order_status_history` and shows on the customer's timeline. **Cancelling restores stock automatically.** Record payments with `payment_status` / `payment_reference`. |
| Reviews | Unverified reviews arrive as `pending`. Set `status = 'approved'` or `'rejected'`. Product ratings recalculate automatically. |
| Coupons | Insert into `coupons`: `percentage` or `fixed`, with optional `minimum_order`, `maximum_discount`, `usage_limit`, `usage_limit_per_customer`, `starts_at`/`expires_at`. Usage is recorded per order. |
| Shipping | `shipping_methods`: price, free-shipping threshold, delivery days, allowed countries. |
| Policy pages | Edit `pages.content` (Markdown), `title` and `summary` (used as the meta description). The "Last updated" date is maintained automatically. |
| Newsletter | Read `newsletter_subscribers` (admins only). |

## Payments

Payment methods implement one interface, [`src/lib/payments/types.ts`](src/lib/payments/types.ts), and are listed in [`src/lib/payments/registry.ts`](src/lib/payments/registry.ts).

Built in:
- **Cash on Delivery** (`cod`): the order is `confirmed` immediately, with payment `pending` until it is collected.
- **Bank transfer** (`bank_transfer`): the order stays `pending` until you confirm the payment. Account details are shown on the confirmation page. It is offered only when `BANK_TRANSFER_IBAN` is set.

The app never simulates a payment. A method appears at checkout only when it is enabled in `PAYMENT_METHODS` **and** `isConfigured()` returns true.

**Adding a gateway** (Stripe, PayFast, JazzCash, Easypaisa, …):
1. Implement `PaymentProvider`:
   - Use `initialOrderStatus: "pending"`.
   - `initiate()` creates the hosted payment session and returns `{ type: "redirect", url }`.
   - `handleWebhook()` verifies the gateway's signature, then updates `orders.payment_status` / `payment_reference` / `status` using the service-role client (`src/lib/supabase/admin.ts`).
2. Register it in `registry.ts` and add its code to `PAYMENT_METHODS`.
3. Point the gateway's webhook at `https://your-domain/api/payments/<code>/webhook`.

The order total sent to the gateway always comes from `place_order`'s result, never from the browser.

## Architecture

```
src/
  app/                    Routes (App Router)
    (shop)/               Storefront, account, auth and policy pages (header + footer chrome)
    (checkout)/           Checkout + confirmation (minimal chrome)
    api/                  search suggestions, revalidation, payment webhooks
    auth/confirm/         Email-link verification (token_hash / code exchange)
    sitemap.ts, robots.ts, globals.css, fonts.ts, layout.tsx
  components/             Shared UI: ui/ primitives, layout/ chrome, product/ cards, providers/
  features/<domain>/      Feature modules (auth, cart, checkout, account, wishlist, compare,
                          reviews, shop, product, home, search, orders, content, marketing):
                          components + their server actions (actions.ts)
  lib/
    supabase/             server (cookie, RLS) · public (cookie-free, cached) · admin (service role)
    data/                 Server-only data access (catalog, cart, orders, account, reviews, pages)
    validation/           Zod schemas shared by forms and server actions; filter parsing
    payments/             Payment provider abstraction
    env.ts, env.server.ts, seo.ts
  hooks/, stores/         Small client stores (compare, recently viewed, guest wishlist)
  content/                Brand, navigation and homepage content
  types/                  database.ts (generated) + domain types
  utils/                  formatting, class names, safe Markdown renderer
supabase/
  migrations/  seed.sql  templates/  tests/  config.toml
scripts/seed/             Seed and placeholder-image generators (npm run seed:generate / images:generate)
tests/e2e/                Playwright suites
```

**Data flow**
- **Reads.** Server Components call `src/lib/data/*`. Public catalogue reads use a cookie-free client, cached and tagged `catalog`/`content`. User data uses the cookie client and is scoped by RLS.
- **Writes.** Server Actions parse their input with Zod and return a typed `ActionResult`. Client components call them through React Hook Form and `useTransition`.
- **Money.** `calculate_cart()` (quotes) and `place_order()` (checkout) are Postgres functions. Prices, sale prices, coupons, shipping, tax and stock are computed there from the database, inside one transaction for orders. Order items snapshot the product name, variant, SKU, image and unit price.

## Security model

- **RLS on every table.** Customers can read and write only their own profile, addresses, wishlist, reviews and orders. The catalogue is public read-only. Coupons, coupon usage and subscribers are admin or server only.
- **Column privileges** stop customers from changing `profiles.role`, review `status`/`verified_purchase`, or any order field. A trigger re-derives review status for non-admins.
- **The service-role key** is used only in `server-only` modules (`src/lib/supabase/admin.ts`, `src/lib/env.server.ts`). It is never sent to the browser.
- **Prices are never trusted from the client.** The cart stores only variant IDs and quantities, and every total is recomputed by the database. Checkout locks variant rows and decrements stock atomically, so concurrent buyers cannot oversell.
- **Guest orders** are reachable only through an unguessable access token, on the confirmation page, or by order number + email (`/track-order`).
- **Auth:**
  - Sessions are refreshed in `src/proxy.ts`, and account routes are protected on the server.
  - `?next=` redirects are restricted to same-site paths.
  - Login errors are generic, and the forgot-password response does not reveal whether an account exists.
- **Newsletter** sign-ups go through the server with a honeypot. Subscribers cannot be read publicly.
- **Uploads:** review images are type- and size-checked on the server and in the bucket, and stored under `review-images/<user id>/…`. A storage policy enforces that path.
- **Headers:** `nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, and HSTS in production.

## Testing

```bash
npm run typecheck      # next typegen + tsc
npm run lint           # eslint
npm run build

# Database business rules: pricing, coupons, stock locking, oversell protection,
# RLS isolation, review rules. Runs in a transaction that is rolled back.
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run test:db

# End-to-end, against a running app and a freshly seeded local Supabase
npm run build && npm run start      # terminal 1
npm run test:e2e                    # terminal 2
```

The Playwright suites in `tests/e2e/` cover:
- the guest journey: product → bag → checkout → confirmation, with server-priced coupons;
- the account journey: register, address book, saved-address checkout, verified review, sign out and back in;
- discovery: search, filters, sorting, pagination, compare, order tracking;
- the mobile menu, filter drawer and quick add on a Pixel 7 viewport.

Set `E2E_BASE_URL` to test a deployed environment. If Playwright's own browser isn't installed, set `PLAYWRIGHT_CHROMIUM` to a local Chromium binary.

## Deployment

The app deploys to **Vercel** (or any Node host that runs `next start`):

1. Import the repository and set the environment variables above. Make sure `NEXT_PUBLIC_SITE_URL` is your production origin.
2. Build: `npm run build`. Start: `npm run start`.
3. In Supabase, add your production `/auth/confirm` URL to the redirect URLs and set the Site URL.
4. Add the revalidation webhook (step 8 of the Supabase setup).

`next.config.ts` adds the Supabase Storage host to `images.remotePatterns` from `NEXT_PUBLIC_SUPABASE_URL`, so product photos in Storage work with `next/image` without further setup.

## Customisation

- **Brand and content:**
  - Brand name, contact details, socials, free-shipping threshold and announcements: `src/content/site.ts`.
  - Menus and mega-menu features: `src/content/navigation.ts`.
  - Homepage slides and sections: `src/content/home.ts`.
- **Design tokens:** colours, fonts and utilities are defined in `src/app/globals.css` (`@theme`).
- **Fonts:** the brand display face is **Bryn Vogue**, a commercial font. Until its licensed `.woff2` is added, Bodoni Moda (OFL) is used as the fallback. To switch, add the font file to `src/app/fonts/` and follow the comment in `src/app/fonts.ts`. Jost (UI) and Open Sans (body) are self-hosted.
- **Imagery:** everything in `public/images/` is generated placeholder art (`npm run images:generate`). Before launch, replace it with real photography: product shots in the `product-images` bucket, campaign images in `public/images/` or Storage, and update the URLs in `src/content/home.ts` and the database.

## Known limitations

- **Demo mode** is meant for previews. State lives in each visitor's cookies, stock is never reduced, and older demo orders roll off. Connect Supabase for a real store.
- **No admin dashboard.** Use the Supabase dashboard (see above). Admin permissions are already enforced in the database.
- **No transactional order emails.** Supabase Auth sends account emails only; there are no order confirmation or shipping emails. Add them with a provider (Resend, Postmark, …), called from `placeOrderAction` and from an order-status webhook.
- **No online card or wallet gateway** is bundled. Only COD and bank transfer are built in; see [Payments](#payments).
- **Rate limiting** relies on Supabase Auth's built-in limits. Add edge rate limiting (e.g. Vercel Firewall / Upstash) for checkout, newsletter and review endpoints on high-traffic stores.
- **No Content-Security-Policy header** yet. Add one tailored to your analytics and payment providers.
- Placeholder imagery and the fallback display font, as noted above.

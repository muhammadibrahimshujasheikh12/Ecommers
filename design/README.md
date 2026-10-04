# AURAQ — Homepage Design

A premium Pakistani fashion e-commerce homepage, designed directly in code (HTML/CSS/vanilla JS) so it can be ported 1:1 to Next.js + Supabase.

**AURAQ** is a placeholder brand name. Swap the wordmark in `prototype/index.html` and `logo__word` styles once the client's identity is final.

## View it

```bash
cd design/prototype
python3 -m http.server 8000
# open http://localhost:8000            → homepage (1440 / 1024 / 390 responsive)
# open http://localhost:8000/components.html → component & state sheet
```

Add `?static` to the homepage URL to stop the hero autoplay (useful for screenshots/reviews).

Rendered screenshots are in [`screens/`](screens):

| File | Shows |
|---|---|
| `homepage-desktop-1440.jpg` | Full homepage, desktop |
| `homepage-tablet-1024.jpg` | Full homepage, tablet |
| `homepage-mobile-390.jpg` | Full homepage, mobile (@2x) |
| `components.jpg` | Foundations + every component with variants/states |
| `state-*.jpg` | Mega menu, product hover + wishlist, search typing, bag drawer, account menu, mobile nav, mobile quick-add |

## Structure

```
design/
├── tokens/tokens.json        Design tokens (W3C DTCG). Source of truth.
├── prototype/
│   ├── index.html            Homepage markup — one <section> per homepage block
│   ├── components.html       Component sheet (variants + interaction states)
│   ├── css/tokens.css        Tokens as CSS custom properties + tablet/mobile overrides
│   ├── css/base.css          Primitives, header, mega menu, search, drawers, toast
│   ├── css/home.css          Homepage sections, product card, responsive layouts
│   ├── css/sheet.css         Component-sheet layout only
│   ├── js/data.js            Content model (mirrors planned Supabase tables)
│   ├── js/media.js           Photography slots + art-directed stand-ins
│   ├── js/components.js      Reusable templates: ProductCard, CategoryTile, ReviewCard…
│   ├── js/app.js             Homepage rendering + interactions
│   └── fonts/                Drop licensed Bryn Vogue .woff2 here
└── screens/                  Rendered screenshots
```

## Design system

**Palette.** Warm ivory page (`#FBF8F3`), soft cream and warm beige for alternating surfaces, deep charcoal (`#2A2826`) for text and primary CTAs. Blush, dusty rose, sage, powder blue and lavender are used **only as section surfaces** (announcement bar, spotlight, newsletter), never as text, so the UI stays refined rather than pink. All text pairs pass WCAG AA.

**Type.**
- **Bryn Vogue** — campaign names, section headings (uppercase, +4% tracking), collection names, editorial statements. Falls back to Bodoni Moda until the licence files are added.
- **Jost** (geometric sans) — navigation, buttons, labels, badges, product names, prices. Swap for Futura PT if licensed.
- **Open Sans** — paragraphs, reviews, functional copy.
- Mobile has its **own scale** (Display XL 104 → 54, Heading L 44 → 34, nav 13 → 14 for touch), not a proportional shrink.

**Layout.** 12-col / 64 margin / 24 gutter at 1440 · 8-col / 40 / 20 at 1024 · 4-col / 16 / 12 at 390. Section rhythm 128 / 96 / 64. Square corners, hairline borders, three shadow levels used only on overlays.

## Homepage sections

1. **Announcement bar.** Rotating messages, customer-care line, currency.
2. **Header.** Search left · wordmark centre · account / wishlist / bag right. Compacts on scroll.
3. **Main nav + mega menu.** Shop by Category · Shop by Collection · Discover, plus two editorial images.
4. **Hero campaign.** Full-bleed, 3 campaigns, crossfade with hairline progress indicators and minimal arrows; swipe on mobile.
5. **Campaign stories.** Asymmetric: tall lead image with an ivory caption panel, plus two landscape stories.
6. **Shop by category.** Six 2:3 portrait tiles; horizontal snap scroll on mobile.
7. **New arrivals.** 4-up product grid (2-up on mobile).
8. **Editorial break.** "A Study in Elegance".
9. **Shop the look.** Numbered hotspots linked to the product list (hover either one to highlight both), plus *Add All to Bag*.
10. **Best sellers.** Same card on a cream surface with a centred header for variation.
11. **Collection spotlight.** 50/50 split on sage with craft facts.
12. **Watch & shop.** 9:16 reel cards; product panel slides up on hover (always visible on mobile).
13. **Reviews.** Aggregate score, then three restrained review cards (swipe on mobile).
14. **Trust strip.** Four line-icon services separated by hairlines.
15. **Style with us.** Six-image editorial mosaic, Instagram icon on hover.
16. **Newsletter.** "Join Our World" on powder blue, underline input with focus, error and success states.
17. **Footer.** Brand, contact, Shop / Customer Care / Legal / Follow, mini newsletter, payment methods (incl. JazzCash, Easypaisa, COD), country/currency dropdown. Becomes accordions on mobile.

## Product card

Variants: **Default · Hover · Sale · New · Sold Out**, plus Wishlisted and Mobile.

- 3:4 image; a secondary image swaps in on hover (600ms crossfade).
- Badge top-left; wishlist heart top-right (fills deep rose when selected, with a pop animation).
- On hover, Quick Add shows a size row. On touch, a 36px "+" adds the default size.
- Name (Jost 500), collection line, PKR price. Sale shows the sale price in deep rose, the original struck through, and the % off.
- Colour swatches only when there is more than one colour; rating only in Best Sellers, where it helps the decision.
- Sold Out desaturates the image and swaps Quick Add for *Notify Me*.

## Interactions implemented

Nav hover underline · mega menu open/close (hover + click, keyboard reachable) · product hover / image swap · wishlist toggle + header count · Quick Add (sizes) → bag count bump + toast · bag drawer with qty, remove and free-delivery progress · search overlay with trending chips and live thumbnail results · account menu · mobile drawer with accordions · newsletter validation states · currency dropdown · primary/secondary/text CTA hovers · Escape closes overlays.

## Photography

The sandbox had no access to stock imagery, so every image slot renders an **art-directed stand-in**: studio backdrop or Mughal-arch set, plus a model silhouette in the garment's colour. These show composition, crop and colour story, not final imagery.

To use real photography, register it per slot in `js/media.js`. Slot ids are on each `<svg data-slot="…">`:

```js
AURAQ.mediaManifest["hero-1"] = "/images/festive-edit-hero.jpg";
AURAQ.mediaManifest["hero-1-mobile"] = "/images/festive-edit-hero-mobile.jpg";
AURAQ.mediaManifest["product-mehtab"] = "/images/products/mehtab-1.jpg";
AURAQ.mediaManifest["product-mehtab-2"] = "/images/products/mehtab-2.jpg"; // hover image
```

Recommended crops: hero 16:9 desktop / 9:16 mobile (separate art direction) · product 3:4 · category 2:3 · campaign lead 4:5 · reels 9:16.

## Path to Next.js + Supabase

- `tokens.css` → `app/globals.css` (or a Tailwind `theme.extend` generated from `tokens.json`).
- Each template in `components.js` maps to a React component: `ProductCard`, `CategoryTile`, `ReviewCard`, `LookItem`, `VideoCard`, `MegaMenu`, `SearchOverlay`, `BagDrawer`.
- `data.js` shapes map to tables:
  - `products` (id, name, line, price, compare_at_price, badge, sizes[], colors[], rating, review_count)
  - `product_images` (product_id, position, url)
  - `collections`
  - `categories`
  - `campaigns` (hero / stories / editorial, with desktop + mobile image)
  - `looks` and `look_items` (product_id, hotspot_x, hotspot_y)
  - `videos`
  - `reviews`
- Bag and wishlist state is client-side here; move it to Supabase (`carts`, `wishlists`) keyed to auth/session.

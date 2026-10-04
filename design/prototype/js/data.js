/* Content model for the homepage. Shapes mirror the intended Supabase tables
   (products, collections, categories, reviews, campaigns) so the Next.js build
   can swap this file for queries without touching the components. */

window.AURAQ = window.AURAQ || {};

AURAQ.announcements = [
  "Complimentary delivery on orders above Rs. 5,000",
  "Worldwide shipping to 40+ countries",
  "The Festive Edit — now live online & in store",
];

AURAQ.nav = [
  { label: "New In", href: "#new-in" },
  { label: "Ready to Wear", href: "#", mega: true },
  { label: "Unstitched", href: "#", mega: true },
  { label: "Formals", href: "#", mega: true },
  { label: "Collections", href: "#", mega: true },
  { label: "Best Sellers", href: "#best-sellers" },
  { label: "Sale", href: "#", sale: true },
];

AURAQ.mega = {
  categories: ["3 Piece", "2 Piece", "Shirts", "Co-ords", "Formal Wear", "Luxury Pret"],
  collections: ["Latest Collection", "Festive", "Luxury", "Seasonal Collection", "Signature Collection"],
  more: ["Shop All", "Under Rs. 10,000", "Kids", "Gift Cards"],
  features: [
    { title: "The Festive Edit", sub: "Shop the campaign", art: { kind: "scene", bg: "#CDB6A8", arch: "#DCC8BC", garments: ["#F1E4D2", "#B98F86"], figures: 2 } },
    { title: "Mehr-o-Mah Luxury Pret", sub: "New season", art: { kind: "figure", bg: "#DDE5EB", garment: "#AFC0CD", trouser: "#E9EEF1", accent: "#F4F1EA" } },
  ],
};

AURAQ.hero = [
  {
    eyebrow: "Eid Festive '26",
    title: "The Festive Edit",
    sub: "An expression of timeless elegance.",
    cta: "Shop the Collection",
    art: { kind: "scene", bg: "#7A625B", arch: "#8C7269", floor: "#6B544E", garments: ["#EFDCCB", "#D7B0A6"], figures: 2, tone: "dark" },
  },
  {
    eyebrow: "Luxury Pret",
    title: "Mehr-o-Mah",
    sub: "Moonlit hues, hand-finished in Lahore.",
    cta: "Discover Luxury Pret",
    art: { kind: "scene", bg: "#5E6B74", arch: "#6F7C85", floor: "#515D66", garments: ["#DDE5EB", "#F4EFE6"], figures: 2, tone: "dark" },
  },
  {
    eyebrow: "Unstitched",
    title: "Summer Lawn Vol. II",
    sub: "Breathable prints for long, golden days.",
    cta: "Shop Unstitched",
    art: { kind: "scene", bg: "#6F7563", arch: "#808671", floor: "#61665A", garments: ["#E4E8D9", "#E9C9BE"], figures: 1, tone: "dark" },
  },
];

AURAQ.campaigns = [
  { title: "The Festive Edit", sub: "Gold-thread organza, tilla and gota for the season of gatherings.", cta: "Shop Now",
    art: { kind: "scene", bg: "#D5BFB4", arch: "#E3D1C7", floor: "#C9B1A5", garments: ["#F4E8DA", "#B78C83"], figures: 1, portrait: true } },
  { title: "Mehr-o-Mah", sub: "Luxury pret in moonlit pastels.", cta: "Shop Now",
    art: { kind: "scene", bg: "#CBD5DC", arch: "#D9E1E7", floor: "#BFCAD1", garments: ["#A9BACB", "#F2EEE6"], figures: 2 } },
  { title: "Summer Lawn Vol. II", sub: "Unstitched three-piece prints.", cta: "Shop Now",
    art: { kind: "scene", bg: "#D6DCCB", arch: "#E2E7D8", floor: "#CAD1BE", garments: ["#9FAE93", "#EAD9C8"], figures: 2 } },
];

AURAQ.categories = [
  { name: "Ready to Wear", count: 214, art: { kind: "figure", bg: "#F3E3DD", garment: "#D3A79C", trouser: "#F4ECE4", accent: "#F7EDE6" } },
  { name: "Unstitched", count: 168, art: { kind: "flatlay", bg: "#E9DDCB", fabrics: ["#C7B08F", "#A9B59C", "#E8C8BD"] } },
  { name: "Luxury Pret", count: 72, art: { kind: "figure", bg: "#E6E1EC", garment: "#B4A8C5", trouser: "#EEEAF2", accent: "#F3EFE4" } },
  { name: "Formals", count: 48, art: { kind: "figure", bg: "#E4DED5", garment: "#7E6470", trouser: "#E4D8C8", accent: "#D9BE8E", long: true } },
  { name: "Co-ords", count: 39, art: { kind: "figure", bg: "#DFE4D5", garment: "#9FAE93", trouser: "#9FAE93", accent: "#EEF0E6", short: true } },
  { name: "Festive", count: 56, art: { kind: "figure", bg: "#DDE5EB", garment: "#EADBC6", trouser: "#EADBC6", accent: "#C8A86A" } },
];

const sizes = ["XS", "S", "M", "L", "XL"];

AURAQ.products = [
  // New arrivals
  { id: "mehtab", name: "Mehtab", line: "Luxury Pret · 3 Piece", price: 24950, badge: "new", sizes,
    colors: ["#E8DCC4", "#C9A9A1", "#AFC0CD"], art: { kind: "figure", bg: "#F3E3DD", garment: "#E8DCC4", trouser: "#F4EEE3", accent: "#C8A86A" } },
  { id: "gul-e-nar", name: "Gul-e-Nar", line: "Ready to Wear · 2 Piece", price: 9950, compare: 12950, badge: "sale", sizes,
    colors: ["#C99A90", "#9FAE93"], art: { kind: "figure", bg: "#F5EFE6", garment: "#C99A90", trouser: "#EFE3D9", accent: "#F2E2D8" } },
  { id: "neelofar", name: "Neelofar", line: "The Festive Edit · Formal", price: 32500, badge: "new", sizes,
    colors: ["#A9BCCB", "#E8DCC4"], art: { kind: "figure", bg: "#DDE5EB", garment: "#9FB3C3", trouser: "#E9EEF1", accent: "#EFE6D2", long: true } },
  { id: "saba", name: "Saba", line: "Summer Lawn · Unstitched 3 Piece", price: 7490, badge: "soldout", sizes,
    colors: ["#A7B39A"], art: { kind: "figure", bg: "#DFE4D5", garment: "#A7B39A", trouser: "#F1EFE6", accent: "#F4F1E8" } },

  // Best sellers
  { id: "zarrin", name: "Zarrin", line: "Signature · Luxury Pret", price: 28950, rating: 4.9, reviews: 212, sizes,
    colors: ["#B8AEC8", "#E8DCC4", "#D3A79C"], art: { kind: "figure", bg: "#E6E1EC", garment: "#B8AEC8", trouser: "#F0EDF3", accent: "#F3EEE2" } },
  { id: "rukhsana", name: "Rukhsana", line: "Ready to Wear · Co-ord Set", price: 11450, rating: 4.8, reviews: 168, sizes,
    colors: ["#CDB79A", "#57524C"], art: { kind: "figure", bg: "#EFE6D8", garment: "#CDB79A", trouser: "#CDB79A", accent: "#E9DDCB", short: true } },
  { id: "shirin", name: "Shirin", line: "The Festive Edit · 3 Piece", price: 18950, compare: 22950, badge: "sale", rating: 4.9, reviews: 341, sizes,
    colors: ["#E3C3BA", "#DFE4D5"], art: { kind: "figure", bg: "#F3E3DD", garment: "#DDB6AC", trouser: "#F3E8E1", accent: "#C8A86A" } },
  { id: "afsana", name: "Afsana", line: "Formals · Kalidar Pishwas", price: 45000, rating: 5.0, reviews: 87, sizes,
    colors: ["#7E6470", "#2A2826"], art: { kind: "figure", bg: "#E9DDCB", garment: "#7E6470", trouser: "#E6D9C6", accent: "#D9BE8E", long: true } },

  // Shop the look
  { id: "sitara-kurta", name: "Sitara Kurta", line: "Ready to Wear · Shirt", price: 14950, sizes,
    colors: ["#E7D3C7"], art: { kind: "figure", bg: "#F5EFE6", garment: "#E7D3C7", trouser: "#E7D3C7", accent: "#C8A86A" } },
  { id: "sitara-dupatta", name: "Sitara Organza Dupatta", line: "Ready to Wear · Dupatta", price: 6950,
    colors: ["#F0E2D6"], art: { kind: "flatlay", bg: "#F3E3DD", fabrics: ["#F0E2D6", "#E5CFC2"] } },
  { id: "sitara-sharara", name: "Sitara Sharara", line: "Ready to Wear · Bottoms", price: 8450,
    colors: ["#D6BBAE"], art: { kind: "flatlay", bg: "#EFE6D8", fabrics: ["#D6BBAE", "#E2CEC3"] } },
];

AURAQ.byId = Object.fromEntries(AURAQ.products.map(p => [p.id, p]));
AURAQ.newArrivals = ["mehtab", "gul-e-nar", "neelofar", "saba"];
AURAQ.bestSellers = ["zarrin", "rukhsana", "shirin", "afsana"];

AURAQ.look = {
  title: "Ivory & Gold, Day to Dusk",
  art: { kind: "scene", bg: "#E4D6CB", arch: "#EDE2D9", floor: "#D9C9BC", garments: ["#E7D3C7"], figures: 1, portrait: true },
  items: [
    { id: "sitara-kurta", hotspot: { x: 45, y: 55 } },
    { id: "sitara-dupatta", hotspot: { x: 63, y: 47 } },
    { id: "sitara-sharara", hotspot: { x: 47, y: 87 } },
  ],
};

AURAQ.videos = [
  { id: "neelofar", duration: "0:18", art: { kind: "scene", bg: "#B9C6CF", arch: "#C8D3DA", floor: "#AFBCC5", garments: ["#9FB3C3"], figures: 1, portrait: true } },
  { id: "shirin", duration: "0:24", art: { kind: "scene", bg: "#D9BDB4", arch: "#E4CCC4", floor: "#CFB1A7", garments: ["#F1E2D8"], figures: 1, portrait: true } },
  { id: "zarrin", duration: "0:15", art: { kind: "scene", bg: "#C9C1D3", arch: "#D6CFDF", floor: "#BEB5C9", garments: ["#B8AEC8"], figures: 1, portrait: true } },
  { id: "rukhsana", duration: "0:21", art: { kind: "scene", bg: "#D8CBB6", arch: "#E3D8C6", floor: "#CDBFA8", garments: ["#CDB79A"], figures: 1, portrait: true } },
];

AURAQ.rating = { average: 4.9, count: 2184, distribution: [94, 4, 1, 1, 0] };

AURAQ.reviews = [
  { title: "Even more beautiful in person", body: "The embroidery on the neckline is so finely done and the organza dupatta drapes perfectly. Wore it to my sister’s mehndi and was asked about it all evening.",
    name: "Hira A.", city: "Lahore", product: "Mehtab — Luxury Pret", date: "2 weeks ago" },
  { title: "True to size, lovely fabric", body: "I was unsure about ordering formals online but the size guide was accurate. Delivered to Karachi in two days and beautifully packed.",
    name: "Sana K.", city: "Karachi", product: "Shirin — The Festive Edit", date: "1 month ago" },
  { title: "Worth every rupee", body: "Ordered to London for Eid. The colour is exactly as pictured, and the exchange process for a different size was effortless.",
    name: "Maryam R.", city: "London, UK", product: "Zarrin — Signature", date: "1 month ago" },
];

AURAQ.gallery = [
  { art: { kind: "scene", bg: "#E3D3CB", arch: "#EDE1DA", floor: "#D8C5BB", garments: ["#DDB6AC"], figures: 1, portrait: true } },
  { art: { kind: "figure", bg: "#DDE5EB", garment: "#EADBC6", trouser: "#EADBC6", accent: "#C8A86A", alt: true } },
  { art: { kind: "scene", bg: "#D6DCCB", arch: "#E2E7D8", floor: "#CAD1BE", garments: ["#9FAE93", "#EAD9C8"], figures: 2 } },
  { art: { kind: "figure", bg: "#E6E1EC", garment: "#B8AEC8", trouser: "#F0EDF3", accent: "#F3EEE2" } },
  { art: { kind: "flatlay", bg: "#F3E3DD", fabrics: ["#E8DCC4", "#D3A79C", "#AFC0CD"] } },
  { art: { kind: "figure", bg: "#EFE6D8", garment: "#7E6470", trouser: "#E6D9C6", accent: "#D9BE8E", long: true } },
];

AURAQ.trending = ["Festive formals", "Organza dupatta", "Lawn 3 piece", "Co-ord sets", "Luxury pret", "Sharara"];

AURAQ.editorial = { kind: "scene", bg: "#56604F", arch: "#646F5C", floor: "#4C5546", garments: ["#ECE0CD", "#D8B4AB"], figures: 2, tone: "dark" };
AURAQ.spotlight = { kind: "scene", bg: "#D9C3B8", arch: "#E6D5CC", floor: "#CDB5A9", garments: ["#EAD7C3"], figures: 1, portrait: true };

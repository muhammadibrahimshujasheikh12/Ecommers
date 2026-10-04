// Demo catalogue used to generate supabase/seed.sql and the placeholder
// photography in public/images. Replace with the client's real catalogue
// (or manage products directly in Supabase) before launch.

export const categories = [
  { slug: "ready-to-wear", name: "Ready to Wear", position: 1, description: "Stitched, finished and ready for the day ahead — easy two and three piece suits, kurtas and co-ords in breathable fabrics.", image: "/images/categories/ready-to-wear.jpg" },
  { slug: "3-piece", parent: "ready-to-wear", name: "3 Piece", position: 2, description: "Shirt, dupatta and trouser, styled together and ready to wear.", image: "/images/categories/3-piece.jpg" },
  { slug: "2-piece", parent: "ready-to-wear", name: "2 Piece", position: 3, description: "Shirt and trouser pairings for effortless everyday dressing.", image: "/images/categories/2-piece.jpg" },
  { slug: "shirts", parent: "ready-to-wear", name: "Shirts", position: 4, description: "Embroidered and printed kurtas to style your way.", image: "/images/categories/shirts.jpg" },
  { slug: "co-ords", parent: "ready-to-wear", name: "Co-ords", position: 5, description: "Matching sets with a contemporary silhouette.", image: "/images/categories/co-ords.jpg" },
  { slug: "unstitched", name: "Unstitched", position: 6, description: "Premium lawn, cambric and chiffon fabrics with embroidered panels — tailored exactly to you.", image: "/images/categories/unstitched.jpg" },
  { slug: "unstitched-3-piece", parent: "unstitched", name: "Unstitched 3 Piece", position: 7, description: "Shirt, dupatta and trouser fabric with embroidered panels.", image: "/images/categories/unstitched-3-piece.jpg" },
  { slug: "unstitched-2-piece", parent: "unstitched", name: "Unstitched 2 Piece", position: 8, description: "Printed shirt and trouser fabric sets.", image: "/images/categories/unstitched-2-piece.jpg" },
  { slug: "luxury-pret", name: "Luxury Pret", position: 9, description: "Hand-finished silhouettes in organza, raw silk and chiffon for gatherings, dinners and the season’s celebrations.", image: "/images/categories/luxury-pret.jpg" },
  { slug: "formals", name: "Formal Wear", position: 10, description: "Heirloom-worthy formals with zardozi, tilla and gota work for weddings and festive evenings.", image: "/images/categories/formals.jpg" },
];

export const collections = [
  { slug: "latest", name: "New Season ’26", position: 1, description: "The newest arrivals across ready to wear, luxury pret and unstitched.", image: "/images/collections/latest.jpg" },
  { slug: "festive", name: "The Festive Edit", position: 2, description: "Gold-thread organza, tilla and gota — designed for the season of gatherings.", image: "/images/collections/festive.jpg" },
  { slug: "luxury", name: "Mehr-o-Mah Luxury", position: 3, description: "Moonlit pastels in hand-finished luxury pret.", image: "/images/collections/luxury.jpg" },
  { slug: "seasonal", name: "Summer Lawn Vol. II", position: 4, description: "Breathable lawn prints for long, golden days.", image: "/images/collections/seasonal.jpg" },
  { slug: "signature", name: "The Signature Collection", position: 5, description: "Limited pieces with up to 120 hours of handwork, crafted in our Lahore atelier.", image: "/images/collections/signature.jpg" },
];

const STITCHED = ["XS", "S", "M", "L", "XL"];

// art: drives the placeholder photography generator.
export const products = [
  { slug: "mehtab", name: "Mehtab", category: "luxury-pret", collections: ["luxury", "latest"], price: 24950, featured: true, sales: 140,
    colors: [["Ivory Gold", "#E8DCC4"], ["Blush", "#E3C3BA"]], fabric: "organza", piece: "3 Piece",
    art: { bg: "#F3E3DD", garment: "#E8DCC4", accent: "#C8A86A" } },
  { slug: "gul-e-nar", name: "Gul-e-Nar", category: "2-piece", collections: ["latest", "seasonal"], price: 9950, compare: 12950, featured: true, sales: 210,
    colors: [["Pomegranate Rose", "#C99A90"], ["Sage", "#9FAE93"]], fabric: "lawn", piece: "2 Piece",
    art: { bg: "#F5EFE6", garment: "#C99A90", accent: "#F2E2D8" } },
  { slug: "neelofar", name: "Neelofar", category: "formals", collections: ["festive", "latest"], price: 32500, featured: true, sales: 96,
    colors: [["Powder Blue", "#9FB3C3"]], fabric: "chiffon", piece: "3 Piece",
    art: { bg: "#DDE5EB", garment: "#9FB3C3", accent: "#EFE6D2", long: true } },
  { slug: "saba", name: "Saba", category: "unstitched-3-piece", collections: ["seasonal"], price: 7490, sales: 320, soldOut: true,
    colors: [["Sage", "#A7B39A"]], fabric: "lawn", piece: "Unstitched 3 Piece", unstitched: true,
    art: { bg: "#DFE4D5", garment: "#A7B39A", accent: "#F4F1E8" } },
  { slug: "zarrin", name: "Zarrin", category: "luxury-pret", collections: ["signature", "luxury"], price: 28950, featured: true, sales: 412,
    colors: [["Lavender", "#B8AEC8"], ["Ivory", "#E8DCC4"]], fabric: "raw silk", piece: "3 Piece",
    art: { bg: "#E6E1EC", garment: "#B8AEC8", accent: "#F3EEE2" } },
  { slug: "rukhsana", name: "Rukhsana", category: "co-ords", collections: ["latest"], price: 11450, sales: 368,
    colors: [["Sand", "#CDB79A"], ["Charcoal", "#57524C"]], fabric: "cotton net", piece: "Co-ord Set",
    art: { bg: "#EFE6D8", garment: "#CDB79A", accent: "#E9DDCB", short: true } },
  { slug: "shirin", name: "Shirin", category: "3-piece", collections: ["festive"], price: 18950, compare: 22950, featured: true, sales: 455,
    colors: [["Blush", "#DDB6AC"], ["Mint", "#BFD0C0"]], fabric: "chiffon", piece: "3 Piece",
    art: { bg: "#F3E3DD", garment: "#DDB6AC", accent: "#C8A86A" } },
  { slug: "afsana", name: "Afsana", category: "formals", collections: ["signature", "festive"], price: 45000, sales: 188,
    colors: [["Plum", "#7E6470"]], fabric: "raw silk", piece: "Kalidar Pishwas",
    art: { bg: "#E9DDCB", garment: "#7E6470", accent: "#D9BE8E", long: true } },
  { slug: "sitara-kurta", name: "Sitara Kurta", category: "shirts", collections: ["latest", "festive"], price: 14950, sales: 122,
    colors: [["Ivory", "#E7D3C7"]], fabric: "cotton silk", piece: "Shirt",
    art: { bg: "#F5EFE6", garment: "#E7D3C7", accent: "#C8A86A" } },
  { slug: "sitara-organza-dupatta", name: "Sitara Organza Dupatta", category: "ready-to-wear", collections: ["latest", "festive"], price: 6950, sales: 98,
    colors: [["Ivory", "#F0E2D6"]], fabric: "organza", piece: "Dupatta", oneSize: true,
    art: { bg: "#F3E3DD", fabrics: ["#F0E2D6", "#E5CFC2"], flatlay: true } },
  { slug: "sitara-sharara", name: "Sitara Sharara", category: "ready-to-wear", collections: ["latest", "festive"], price: 8450, sales: 76,
    colors: [["Ivory", "#D6BBAE"]], fabric: "cotton silk", piece: "Sharara",
    art: { bg: "#EFE6D8", fabrics: ["#D6BBAE", "#E2CEC3"], flatlay: true } },
  { slug: "noor", name: "Noor", category: "3-piece", collections: ["festive", "latest"], price: 16950, sales: 154,
    colors: [["Mint", "#BFD0C0"]], fabric: "lawn", piece: "3 Piece",
    art: { bg: "#DFE4D5", garment: "#BFD0C0", accent: "#F4F1E8" } },
  { slug: "mahnaz", name: "Mahnaz", category: "shirts", collections: ["seasonal"], price: 6950, sales: 233,
    colors: [["Powder", "#AFC0CD"]], fabric: "lawn", piece: "Shirt",
    art: { bg: "#DDE5EB", garment: "#AFC0CD", accent: "#F4F1EA" } },
  { slug: "laila", name: "Laila", category: "2-piece", collections: ["latest"], price: 10950, sales: 141,
    colors: [["Dusty Rose", "#D3A79C"]], fabric: "cambric", piece: "2 Piece",
    art: { bg: "#F3E3DD", garment: "#D3A79C", accent: "#F7EDE6" } },
  { slug: "rubaab", name: "Rubaab", category: "luxury-pret", collections: ["luxury"], price: 34950, sales: 64,
    colors: [["Champagne", "#E6D3B3"]], fabric: "organza", piece: "3 Piece",
    art: { bg: "#EFE6D8", garment: "#E6D3B3", accent: "#C8A86A", long: true } },
  { slug: "zoya", name: "Zoya", category: "co-ords", collections: ["seasonal"], price: 9450, compare: 11950, sales: 170,
    colors: [["Lilac", "#CBBFD6"]], fabric: "linen", piece: "Co-ord Set",
    art: { bg: "#E6E1EC", garment: "#CBBFD6", accent: "#EEEAF2", short: true } },
  { slug: "gulrukh", name: "Gulrukh", category: "unstitched-3-piece", collections: ["seasonal", "latest"], price: 8990, sales: 260,
    colors: [["Peach", "#E9C4AE"]], fabric: "lawn", piece: "Unstitched 3 Piece", unstitched: true,
    art: { bg: "#F3E3DD", garment: "#E9C4AE", accent: "#F7EDE6" } },
  { slug: "anaya", name: "Anaya", category: "unstitched-2-piece", collections: ["seasonal"], price: 5490, sales: 198,
    colors: [["Sky", "#B9CBD6"]], fabric: "lawn", piece: "Unstitched 2 Piece", unstitched: true,
    art: { bg: "#DDE5EB", garment: "#B9CBD6", accent: "#F4F1EA" } },
  { slug: "mehrunisa", name: "Mehrunisa", category: "formals", collections: ["festive", "signature"], price: 58000, sales: 42,
    colors: [["Deep Teal", "#5F7D78"]], fabric: "raw silk", piece: "Lehnga Set",
    art: { bg: "#DFE4D5", garment: "#5F7D78", accent: "#D9BE8E", long: true } },
  { slug: "parizad", name: "Parizad", category: "luxury-pret", collections: ["signature"], price: 39500, sales: 58,
    colors: [["Rose Gold", "#D9B3A4"]], fabric: "chiffon", piece: "3 Piece",
    art: { bg: "#F3E3DD", garment: "#D9B3A4", accent: "#C8A86A", long: true } },
  { slug: "hoorain", name: "Hoorain", category: "unstitched-3-piece", collections: ["festive"], price: 12950, sales: 117,
    colors: [["Ivory", "#EFE3CF"]], fabric: "chiffon", piece: "Unstitched 3 Piece", unstitched: true,
    art: { bg: "#E9DDCB", garment: "#EFE3CF", accent: "#C8A86A" } },
  { slug: "benazir", name: "Benazir", category: "3-piece", collections: ["signature"], price: 21950, sales: 133,
    colors: [["Graphite", "#6B6762"]], fabric: "karandi", piece: "3 Piece",
    art: { bg: "#E9DDCB", garment: "#6B6762", accent: "#D9BE8E" } },
  { slug: "fiza", name: "Fiza", category: "shirts", collections: ["latest"], price: 5950, compare: 7450, sales: 287,
    colors: [["Butter", "#EFE2B0"]], fabric: "lawn", piece: "Shirt",
    art: { bg: "#F5EFE6", garment: "#EFE2B0", accent: "#F7F1DA" } },
  { slug: "sahar", name: "Sahar", category: "2-piece", collections: ["seasonal"], price: 8450, sales: 152,
    colors: [["Aqua Mist", "#BFD8D2"]], fabric: "lawn", piece: "2 Piece",
    art: { bg: "#DFE4D5", garment: "#BFD8D2", accent: "#F4F1E8" } },
].map((p) => ({ ...p, sizes: p.unstitched || p.oneSize ? ["One Size"] : STITCHED }));

const FABRIC_COPY = {
  organza: { material: "Silk organza shirt with chiffon dupatta and raw silk trouser.", feel: "light, structured organza that holds its shape beautifully" },
  lawn: { material: "100% cotton lawn (80 x 80 count).", feel: "breathable, fine-count cotton lawn that softens with every wash" },
  chiffon: { material: "Pure chiffon with silk lining.", feel: "fluid chiffon with a gentle drape and soft lining" },
  "raw silk": { material: "Raw silk with organza dupatta.", feel: "rich raw silk with a subtle natural slub" },
  "cotton net": { material: "Cotton net with cotton lining.", feel: "airy cotton net layered over a soft cotton lining" },
  "cotton silk": { material: "Cotton silk blend.", feel: "a cotton silk blend with a quiet sheen" },
  cambric: { material: "Premium cotton cambric.", feel: "crisp, opaque cambric that is easy to wear all day" },
  linen: { material: "Linen blend.", feel: "relaxed linen with a soft, lived-in texture" },
  karandi: { material: "Pure karandi.", feel: "warm, textured karandi for cooler evenings" },
};

export function describe(p) {
  const f = FABRIC_COPY[p.fabric];
  const colour = p.colors[0][0].toLowerCase();
  const isUnstitched = Boolean(p.unstitched);
  const short = isUnstitched
    ? `${p.piece} in ${f.feel.split(" ").slice(0, 3).join(" ")} ${p.fabric}, with embroidered neckline panel.`
    : `${p.piece} in ${colour} ${p.fabric} with delicate hand-finished embroidery.`;
  const description = [
    `${p.name} is cut from ${f.feel}. The ${colour} base is finished with tonal threadwork at the neckline and a scalloped border along the hem, so it reads quietly elegant by day and catches the light in the evening.`,
    isUnstitched
      ? "Supplied as unstitched fabric so it can be tailored exactly to your measurements. Embroidered panels are pre-cut for easy stitching."
      : "Designed with a relaxed, straight silhouette that sits comfortably from morning to late evening. Pair with flats for daytime or juttis and statement jhumkas for gatherings.",
  ].join("\n\n");
  const details = isUnstitched
    ? [
        { label: "Shirt", value: "Embroidered front 1.25m, back & sleeves 1.75m" },
        ...(p.piece.includes("3") ? [{ label: "Dupatta", value: "Printed dupatta 2.5m" }] : []),
        { label: "Trouser", value: "Dyed trouser 2.5m" },
        { label: "Includes", value: "Embroidered neckline and border panels" },
      ]
    : [
        { label: "Fit", value: "Relaxed straight fit, true to size" },
        { label: "Length", value: p.art.long ? "Floor length (54 in)" : p.art.short ? "Hip length (32 in)" : "Knee length (42 in)" },
        { label: "Embellishment", value: "Thread and sequin embroidery, hand finished" },
        { label: "Pieces", value: p.piece },
      ];
  const care = p.fabric === "lawn" || p.fabric === "cambric"
    ? "Gentle machine wash cold with similar colours. Do not bleach. Dry in shade. Iron on the reverse."
    : "Dry clean only. Store folded in a muslin cloth away from direct sunlight. Steam rather than iron embroidered areas.";
  return { short, description, material: f.material, care, details };
}

export const shippingMethods = [
  { code: "standard", name: "Standard Delivery", description: "Nationwide delivery via our courier partners.", price: 250, free: 5000, min: 3, max: 5, countries: ["PK"], position: 1 },
  { code: "express", name: "Express Delivery", description: "Priority dispatch for Lahore, Karachi and Islamabad.", price: 650, free: null, min: 1, max: 2, countries: ["PK"], position: 2 },
  { code: "international", name: "International Shipping", description: "Tracked worldwide delivery. Duties may apply on arrival.", price: 6500, free: 60000, min: 7, max: 12, countries: ["AE", "SA", "QA", "GB", "US", "CA", "AU"], position: 3 },
];

export const coupons = [
  { code: "WELCOME10", description: "10% off your first order", type: "percentage", value: 10, min: 5000, max: 3000, perCustomer: 1 },
  { code: "FESTIVE1500", description: "Rs. 1,500 off orders over Rs. 15,000", type: "fixed", value: 1500, min: 15000, max: null, perCustomer: null, expires: "2026-12-31T23:59:59+05:00" },
];

export const demoUsers = [
  { email: "hira.a@example.com", first: "Hira", last: "Ahmed", city: "Lahore" },
  { email: "sana.k@example.com", first: "Sana", last: "Khan", city: "Karachi" },
  { email: "maryam.r@example.com", first: "Maryam", last: "Raza", city: "London" },
  { email: "ayesha.m@example.com", first: "Ayesha", last: "Malik", city: "Islamabad" },
  { email: "zainab.h@example.com", first: "Zainab", last: "Hussain", city: "Dubai" },
  { email: "fatima.s@example.com", first: "Fatima", last: "Sheikh", city: "Multan" },
];

// [userIndex, productSlug, rating, title, content, verified]
export const reviews = [
  [0, "mehtab", 5, "Even more beautiful in person", "The embroidery on the neckline is so finely done and the organza dupatta drapes perfectly. Wore it to my sister’s mehndi and was asked about it all evening.", true],
  [1, "shirin", 5, "True to size, lovely fabric", "I was unsure about ordering formals online but the size guide was accurate. Delivered to Karachi in two days and beautifully packed.", true],
  [2, "zarrin", 5, "Worth every rupee", "Ordered to London for Eid. The colour is exactly as pictured, and the exchange process for a different size was effortless.", true],
  [3, "zarrin", 4, "Elegant and comfortable", "Beautiful raw silk with a soft lining. The trouser runs slightly long for me but the shirt fits perfectly.", true],
  [4, "zarrin", 5, "My favourite purchase this year", "The lavender is so soft and the handwork is exquisite. Compliments all night at a wedding dinner.", false],
  [5, "gul-e-nar", 5, "Perfect everyday suit", "Breathable lawn and the print is gorgeous. Bought it on sale — great value for the quality.", true],
  [0, "gul-e-nar", 4, "Pretty colour", "Lovely colour and very comfortable in the heat. Colour faded very slightly after a few washes in warm water, so wash cold.", true],
  [1, "rukhsana", 5, "Chic co-ord set", "Modern cut and the sand colour is very versatile. I wear the trousers with other kurtas too.", true],
  [3, "rukhsana", 5, "Great fit", "Fits beautifully and the cotton net is lighter than I expected. Perfect for summer dinners.", false],
  [2, "shirin", 5, "Festive perfection", "The gold border catches the light so beautifully. Packaging felt like a gift.", true],
  [4, "shirin", 4, "Lovely, slightly sheer", "Gorgeous suit, the chiffon is a little sheer so I wore a slip underneath. Otherwise perfect.", true],
  [5, "afsana", 5, "Stunning formal", "This kalidar is breathtaking. Heavy, rich fabric and the zardozi is hand finished. Wore it for my nikkah dinner.", true],
  [0, "neelofar", 5, "Like a dream", "The powder blue is so soft and elegant. Fits exactly to the size chart.", false],
  [3, "saba", 5, "Best lawn of the season", "Soft lawn that stitched beautifully. Sold out quickly for a reason!", true],
  [1, "saba", 4, "Lovely print", "Print is beautiful and the embroidered panel is a nice touch. Dupatta is slightly thin.", true],
  [2, "noor", 5, "Fresh and pretty", "The mint colour is beautiful in daylight. Comfortable for long family gatherings.", true],
  [4, "fiza", 4, "Bright summer shirt", "Cheerful colour and easy to style with white trousers. Great on sale.", false],
  [5, "mahnaz", 5, "Wardrobe staple", "Simple, beautifully finished shirt. Bought a second one for my mother.", true],
  [0, "sitara-kurta", 5, "Elegant kurta", "Beautiful neckline and the cotton silk has a lovely sheen. Pairs perfectly with the Sitara sharara.", true],
  [3, "sitara-organza-dupatta", 5, "Gorgeous dupatta", "Light organza with a delicate border — lifts any plain outfit.", false],
  [1, "benazir", 4, "Warm and graceful", "Karandi is warm without being heavy. The graphite colour is very chic.", true],
  [2, "parizad", 5, "Showstopper", "The rose gold chiffon looks incredible in photos. Excellent stitching quality.", true],
  [5, "gulrukh", 4, "Pretty unstitched set", "Lovely peach lawn, the embroidered panel is well placed. Tailor was impressed with the fabric.", true],
  [4, "laila", 5, "Soft cambric", "Comfortable for office wear and the dusty rose is very flattering.", false],
];

// Demo delivered orders so reviews marked verified are genuinely backed by purchases.
export function verifiedPurchases() {
  const byUser = new Map();
  for (const [u, slug, , , , verified] of reviews) {
    if (!verified) continue;
    if (!byUser.has(u)) byUser.set(u, new Set());
    byUser.get(u).add(slug);
  }
  return byUser;
}

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

// Newest first: created_at is derived from the array position, and the first
// ~15 products carry the "New" badge.
// work: embroidery copy (WORK_COPY, default "threadwork"); material: overrides
// the fabric's material line.
// art: drives the placeholder photography generator (bg, garment, accent;
// long/short silhouette or a flatlay of fabrics; optional trouser, dupatta
// and skin overrides).
export const products = [
  { slug: "mahparah", name: "Mahparah", category: "luxury-pret", collections: ["latest", "luxury"], price: 29950, featured: true, sales: 46,
    colors: [["Mint", "#C9D8CC"], ["Champagne", "#E6D3B3"]], fabric: "organza", piece: "3 Piece", work: "cutwork",
    art: { bg: "#E4E9E2", garment: "#C9D8CC", accent: "#C8A86A", dupatta: "#F1F0E6" } },
  { slug: "zumurrud", name: "Zumurrud", category: "formals", collections: ["latest", "festive", "signature"], price: 54950, featured: true, sales: 22,
    colors: [["Emerald", "#3F6B5C"]], fabric: "raw silk", piece: "Angrakha Set", work: "zardozi",
    art: { bg: "#EFE6D8", garment: "#3F6B5C", accent: "#D9BE8E", long: true, skin: "#B88A6C" } },
  { slug: "naubahar", name: "Naubahar", category: "3-piece", collections: ["latest", "seasonal"], price: 13950, featured: true, sales: 88,
    colors: [["Pistachio", "#C5CFA6"], ["Tea Pink", "#E8C6BE"]], fabric: "lawn", piece: "3 Piece", work: "chikankari",
    art: { bg: "#F5EFE6", garment: "#C5CFA6", accent: "#F3EEDD", dupatta: "#E8C6BE", skin: "#CFA486" } },
  { slug: "mehtab", name: "Mehtab", category: "luxury-pret", collections: ["luxury", "latest"], price: 24950, featured: true, sales: 140,
    colors: [["Ivory Gold", "#E8DCC4"], ["Blush", "#E3C3BA"]], fabric: "organza", piece: "3 Piece",
    art: { bg: "#F3E3DD", garment: "#E8DCC4", accent: "#C8A86A" } },
  { slug: "dilara", name: "Dilara", category: "co-ords", collections: ["latest"], price: 12450, sales: 57,
    colors: [["Rust", "#B5694F"], ["Sand", "#CDB79A"]], fabric: "cotton silk", piece: "Co-ord Set", work: "minimal",
    art: { bg: "#F1E6D9", garment: "#B5694F", accent: "#EAD3BF", short: true } },
  { slug: "gulbano", name: "Gulbano", category: "shirts", collections: ["latest", "seasonal"], price: 5450, compare: 6950, sales: 176,
    colors: [["Sky", "#B9CBD6"], ["Butter", "#EFE2B0"]], fabric: "lawn", piece: "Shirt", work: "print",
    art: { bg: "#F5EFE6", garment: "#B9CBD6", accent: "#F4F1EA", trouser: "#F2EEE6", skin: "#B88A6C" } },
  { slug: "gul-e-nar", name: "Gul-e-Nar", category: "2-piece", collections: ["latest", "seasonal"], price: 9950, compare: 12950, featured: true, sales: 210,
    colors: [["Pomegranate Rose", "#C99A90"], ["Sage", "#9FAE93"]], fabric: "lawn", piece: "2 Piece",
    art: { bg: "#F5EFE6", garment: "#C99A90", accent: "#F2E2D8" } },
  { slug: "sunehri", name: "Sunehri", category: "unstitched-3-piece", collections: ["latest", "festive"], price: 12950, featured: true, sales: 74,
    colors: [["Gold", "#D4B677"], ["Ivory", "#EFE3CF"]], fabric: "jacquard", piece: "Unstitched 3 Piece", unstitched: true, work: "tilla",
    art: { bg: "#E9DDCB", garment: "#D4B677", accent: "#F4EAD5" } },
  { slug: "chandni-organza-dupatta", name: "Chandni Organza Dupatta", category: "ready-to-wear", collections: ["latest", "luxury"], price: 7450, sales: 63,
    colors: [["Off White", "#F2ECE1"], ["Blush", "#E9CFC6"]], fabric: "organza", piece: "Dupatta", oneSize: true, work: "border", material: "Pure silk organza with a cutwork border.",
    art: { bg: "#E6E1EC", fabrics: ["#F2ECE1", "#E9CFC6"], flatlay: true } },
  { slug: "neelofar", name: "Neelofar", category: "formals", collections: ["festive", "latest"], price: 32500, featured: true, sales: 96,
    colors: [["Powder Blue", "#9FB3C3"]], fabric: "chiffon", piece: "3 Piece",
    art: { bg: "#DDE5EB", garment: "#9FB3C3", accent: "#EFE6D2", long: true } },
  { slug: "shagufta", name: "Shagufta", category: "unstitched-2-piece", collections: ["latest", "seasonal"], price: 4990, sales: 142,
    colors: [["Peach", "#E9C4AE"], ["Mint", "#BFD0C0"]], fabric: "lawn", piece: "Unstitched 2 Piece", unstitched: true, work: "print",
    art: { bg: "#E4E9E2", garment: "#E9C4AE", accent: "#F7EDE6", skin: "#CFA486" } },
  { slug: "kehkashan", name: "Kehkashan", category: "3-piece", collections: ["latest", "festive"], price: 18450, compare: 23950, sales: 131,
    colors: [["Mauve", "#B897A0"], ["Ivory", "#EFE3CF"]], fabric: "chiffon", piece: "3 Piece", work: "sequins",
    art: { bg: "#ECE4E6", garment: "#B897A0", accent: "#C8A86A" } },
  { slug: "saba", name: "Saba", category: "unstitched-3-piece", collections: ["seasonal"], price: 7490, sales: 320, soldOut: true,
    colors: [["Sage", "#A7B39A"]], fabric: "lawn", piece: "Unstitched 3 Piece", unstitched: true,
    art: { bg: "#DFE4D5", garment: "#A7B39A", accent: "#F4F1E8" } },
  { slug: "firoza", name: "Firoza", category: "2-piece", collections: ["latest", "festive"], price: 11950, sales: 69,
    colors: [["Turquoise", "#8DB5B0"]], fabric: "cotton silk", piece: "2 Piece", work: "mirror",
    art: { bg: "#EFE6D8", garment: "#8DB5B0", accent: "#D9BE8E", skin: "#B88A6C" } },
  { slug: "raat-rani", name: "Raat Rani", category: "luxury-pret", collections: ["latest", "luxury", "signature"], price: 38950, featured: true, sales: 37,
    colors: [["Midnight", "#3D4A63"]], fabric: "chiffon", piece: "3 Piece", work: "pearl",
    art: { bg: "#DDE5EB", garment: "#3D4A63", accent: "#D9BE8E", long: true, skin: "#CFA486" } },
  { slug: "zarrin", name: "Zarrin", category: "luxury-pret", collections: ["signature", "luxury"], price: 28950, featured: true, sales: 412,
    colors: [["Lavender", "#B8AEC8"], ["Ivory", "#E8DCC4"]], fabric: "raw silk", piece: "3 Piece",
    art: { bg: "#E6E1EC", garment: "#B8AEC8", accent: "#F3EEE2" } },
  { slug: "marjaan", name: "Marjaan", category: "2-piece", collections: ["latest", "seasonal"], price: 8450, compare: 10950, sales: 219,
    colors: [["Coral", "#E0A08C"], ["Aqua Mist", "#BFD8D2"]], fabric: "lawn", piece: "2 Piece", work: "print",
    art: { bg: "#F5EFE6", garment: "#E0A08C", accent: "#F6E6DC" } },
  { slug: "khwab", name: "Khwab", category: "co-ords", collections: ["latest", "luxury"], price: 14450, sales: 41,
    colors: [["Pearl Grey", "#C9C3BC"], ["Lilac", "#CBBFD6"]], fabric: "raw silk", piece: "Co-ord Set", work: "pearl", material: "Raw silk shirt and trouser.",
    art: { bg: "#E6E1EC", garment: "#C9C3BC", accent: "#C8A86A", short: true, skin: "#B88A6C" } },
  { slug: "rukhsana", name: "Rukhsana", category: "co-ords", collections: ["latest"], price: 11450, sales: 368,
    colors: [["Sand", "#CDB79A"], ["Charcoal", "#57524C"]], fabric: "cotton net", piece: "Co-ord Set",
    art: { bg: "#EFE6D8", garment: "#CDB79A", accent: "#E9DDCB", short: true } },
  { slug: "ghazal", name: "Ghazal", category: "shirts", collections: ["latest", "festive"], price: 8950, featured: true, sales: 104,
    colors: [["Rani Pink", "#C2577A"], ["Ivory", "#EFE3CF"]], fabric: "cotton silk", piece: "Shirt", work: "mirror",
    art: { bg: "#F3E3DD", garment: "#C2577A", accent: "#D9BE8E", trouser: "#F2E8E0" } },
  { slug: "yaqoot", name: "Yaqoot", category: "formals", collections: ["festive", "signature"], price: 62950, featured: true, sales: 18,
    colors: [["Wine", "#7A3E48"]], fabric: "velvet", piece: "Gharara Set", work: "zardozi",
    art: { bg: "#E8E2DA", garment: "#7A3E48", accent: "#D9BE8E", long: true } },
  { slug: "shirin", name: "Shirin", category: "3-piece", collections: ["festive"], price: 18950, compare: 22950, featured: true, sales: 455,
    colors: [["Blush", "#DDB6AC"], ["Mint", "#BFD0C0"]], fabric: "chiffon", piece: "3 Piece",
    art: { bg: "#F3E3DD", garment: "#DDB6AC", accent: "#C8A86A" } },
  { slug: "motia", name: "Motia", category: "unstitched-3-piece", collections: ["seasonal"], price: 7990, sales: 341,
    colors: [["Off White", "#F2ECE1"], ["Sage", "#A7B39A"]], fabric: "lawn", piece: "Unstitched 3 Piece", unstitched: true, work: "chikankari",
    art: { bg: "#DFE4D5", garment: "#F2ECE1", accent: "#A7B39A", skin: "#B88A6C" } },
  { slug: "afreen", name: "Afreen", category: "unstitched-2-piece", collections: ["seasonal"], price: 5990, compare: 7490, sales: 158,
    colors: [["Olive", "#8A8B64"], ["Rust", "#B5694F"]], fabric: "cambric", piece: "Unstitched 2 Piece", unstitched: true, work: "print",
    art: { bg: "#EFE6D8", garment: "#8A8B64", accent: "#E9DDC6" } },
  { slug: "afsana", name: "Afsana", category: "formals", collections: ["signature", "festive"], price: 45000, sales: 188,
    colors: [["Plum", "#7E6470"]], fabric: "raw silk", piece: "Kalidar Pishwas",
    art: { bg: "#E9DDCB", garment: "#7E6470", accent: "#D9BE8E", long: true } },
  { slug: "nastaran", name: "Nastaran", category: "3-piece", collections: ["festive", "luxury"], price: 22950, featured: true, sales: 203,
    colors: [["Ivory", "#EFE3CF"], ["Blush", "#E3C3BA"]], fabric: "organza", piece: "3 Piece", work: "gota",
    art: { bg: "#DDE5EB", garment: "#EFE3CF", accent: "#C8A86A", trouser: "#E3C3BA", dupatta: "#E3C3BA", skin: "#CFA486" } },
  { slug: "sitara-kurta", name: "Sitara Kurta", category: "shirts", collections: ["latest", "festive"], price: 14950, sales: 122,
    colors: [["Ivory", "#E7D3C7"]], fabric: "cotton silk", piece: "Shirt",
    art: { bg: "#F5EFE6", garment: "#E7D3C7", accent: "#C8A86A" } },
  { slug: "zafran-gharara", name: "Zafran Gharara", category: "ready-to-wear", collections: ["festive"], price: 7950, compare: 9950, sales: 87,
    colors: [["Mustard", "#C9A04E"]], fabric: "raw silk", piece: "Gharara", work: "hem", material: "Raw silk with a gota-trimmed hem.",
    art: { bg: "#F1E6D9", fabrics: ["#EFE3CF", "#C9A04E"], flatlay: true } },
  { slug: "sitara-organza-dupatta", name: "Sitara Organza Dupatta", category: "ready-to-wear", collections: ["latest", "festive"], price: 6950, sales: 98,
    colors: [["Ivory", "#F0E2D6"]], fabric: "organza", piece: "Dupatta", oneSize: true, work: "border", material: "Pure silk organza with an embroidered border.",
    art: { bg: "#F3E3DD", fabrics: ["#F0E2D6", "#E5CFC2"], flatlay: true } },
  { slug: "sitara-sharara", name: "Sitara Sharara", category: "ready-to-wear", collections: ["latest", "festive"], price: 8450, sales: 76,
    colors: [["Ivory", "#D6BBAE"]], fabric: "cotton silk", piece: "Sharara", work: "hem",
    art: { bg: "#EFE6D8", fabrics: ["#D6BBAE", "#E2CEC3"], flatlay: true } },
  { slug: "banafsha", name: "Banafsha", category: "luxury-pret", collections: ["luxury"], price: 31950, sales: 52,
    colors: [["Violet", "#9E8FB8"], ["Lilac", "#CBBFD6"]], fabric: "organza", piece: "3 Piece", work: "tilla",
    art: { bg: "#E6E1EC", garment: "#9E8FB8", accent: "#F3EEE2", long: true } },
  { slug: "darya", name: "Darya", category: "co-ords", collections: ["seasonal"], price: 10950, sales: 96,
    colors: [["Steel Blue", "#7D93A8"], ["Off White", "#F2ECE1"]], fabric: "linen", piece: "Co-ord Set", work: "minimal",
    art: { bg: "#DDE5EB", garment: "#7D93A8", accent: "#E8EDF1", short: true, skin: "#CFA486" } },
  { slug: "noor", name: "Noor", category: "3-piece", collections: ["festive", "latest"], price: 16950, sales: 154,
    colors: [["Mint", "#BFD0C0"]], fabric: "lawn", piece: "3 Piece",
    art: { bg: "#DFE4D5", garment: "#BFD0C0", accent: "#F4F1E8" } },
  { slug: "gulshan", name: "Gulshan", category: "2-piece", collections: ["seasonal"], price: 7450, sales: 274, soldOut: true,
    colors: [["Sage", "#9FAE93"], ["Peach", "#E9C4AE"]], fabric: "lawn", piece: "2 Piece", work: "print",
    art: { bg: "#F5EFE6", garment: "#9FAE93", accent: "#F2E2D8" } },
  { slug: "mahnaz", name: "Mahnaz", category: "shirts", collections: ["seasonal"], price: 6950, sales: 233,
    colors: [["Powder", "#AFC0CD"]], fabric: "lawn", piece: "Shirt",
    art: { bg: "#DDE5EB", garment: "#AFC0CD", accent: "#F4F1EA" } },
  { slug: "tasneem", name: "Tasneem", category: "shirts", collections: ["seasonal"], price: 4450, compare: 5950, sales: 189,
    colors: [["Lilac", "#CBBFD6"], ["Aqua Mist", "#BFD8D2"]], fabric: "lawn", piece: "Shirt", work: "chikankari",
    art: { bg: "#E4E9E2", garment: "#CBBFD6", accent: "#F4F1EA", trouser: "#F2EEE6", skin: "#B88A6C" } },
  { slug: "arghavan", name: "Arghavan", category: "formals", collections: ["festive", "signature"], price: 46950, sales: 33,
    colors: [["Plum", "#946C82"]], fabric: "raw silk", piece: "Pishwas Set", work: "tilla",
    art: { bg: "#DFE4D5", garment: "#946C82", accent: "#D9BE8E", long: true, skin: "#CFA486" } },
  { slug: "laila", name: "Laila", category: "2-piece", collections: ["latest"], price: 10950, sales: 141,
    colors: [["Dusty Rose", "#D3A79C"]], fabric: "cambric", piece: "2 Piece",
    art: { bg: "#F3E3DD", garment: "#D3A79C", accent: "#F7EDE6" } },
  { slug: "zohra", name: "Zohra", category: "unstitched-3-piece", collections: ["festive"], price: 11950, sales: 92,
    colors: [["Champagne", "#E6D3B3"], ["Blush", "#E3C3BA"]], fabric: "chiffon", piece: "Unstitched 3 Piece", unstitched: true, work: "sequins",
    art: { bg: "#ECE4E6", garment: "#E6D3B3", accent: "#C8A86A" } },
  { slug: "rubaab", name: "Rubaab", category: "luxury-pret", collections: ["luxury"], price: 34950, sales: 64,
    colors: [["Champagne", "#E6D3B3"]], fabric: "organza", piece: "3 Piece",
    art: { bg: "#EFE6D8", garment: "#E6D3B3", accent: "#C8A86A", long: true } },
  { slug: "shehnai", name: "Shehnai", category: "3-piece", collections: ["festive", "signature"], price: 24950, sales: 167,
    colors: [["Deep Teal", "#5F7D78"], ["Gold", "#D4B677"]], fabric: "raw silk", piece: "3 Piece", work: "gota",
    art: { bg: "#F3E3DD", garment: "#5F7D78", accent: "#D9BE8E", dupatta: "#D4B677", skin: "#B88A6C" } },
  { slug: "zoya", name: "Zoya", category: "co-ords", collections: ["seasonal"], price: 9450, compare: 11950, sales: 170,
    colors: [["Lilac", "#CBBFD6"]], fabric: "linen", piece: "Co-ord Set",
    art: { bg: "#E6E1EC", garment: "#CBBFD6", accent: "#EEEAF2", short: true } },
  { slug: "gulzar", name: "Gulzar", category: "unstitched-2-piece", collections: ["seasonal"], price: 4490, sales: 236,
    colors: [["Mint", "#BFD0C0"], ["Coral", "#E0A08C"]], fabric: "lawn", piece: "Unstitched 2 Piece", unstitched: true, work: "print",
    art: { bg: "#F3E3DD", garment: "#BFD0C0", accent: "#F7EDE6" } },
  { slug: "huma", name: "Huma", category: "luxury-pret", collections: ["luxury", "signature"], price: 36950, featured: true, sales: 71,
    colors: [["Ivory", "#EFE3CF"], ["Pearl Grey", "#CFCAC2"]], fabric: "chiffon", piece: "3 Piece", work: "pearl",
    art: { bg: "#DFE4D5", garment: "#EFE3CF", accent: "#C8A86A", long: true, dupatta: "#F6F0E4", skin: "#B88A6C" } },
  { slug: "gulrukh", name: "Gulrukh", category: "unstitched-3-piece", collections: ["seasonal", "latest"], price: 8990, sales: 260,
    colors: [["Peach", "#E9C4AE"]], fabric: "lawn", piece: "Unstitched 3 Piece", unstitched: true,
    art: { bg: "#F3E3DD", garment: "#E9C4AE", accent: "#F7EDE6" } },
  { slug: "laaleh", name: "Laaleh", category: "co-ords", collections: ["luxury"], price: 11950, compare: 14950, sales: 112,
    colors: [["Tea Pink", "#E8C6BE"], ["Mustard", "#C9A04E"]], fabric: "cotton net", piece: "Co-ord Set", work: "cutwork",
    art: { bg: "#F5EFE6", garment: "#E8C6BE", accent: "#C8A86A", short: true, skin: "#CFA486" } },
  { slug: "anaya", name: "Anaya", category: "unstitched-2-piece", collections: ["seasonal"], price: 5490, sales: 198,
    colors: [["Sky", "#B9CBD6"]], fabric: "lawn", piece: "Unstitched 2 Piece", unstitched: true,
    art: { bg: "#DDE5EB", garment: "#B9CBD6", accent: "#F4F1EA" } },
  { slug: "kashish", name: "Kashish", category: "shirts", collections: ["seasonal"], price: 6950, sales: 248, soldOut: true,
    colors: [["Mustard", "#C9A04E"]], fabric: "cambric", piece: "Shirt", work: "minimal",
    art: { bg: "#DDE5EB", garment: "#C9A04E", accent: "#F4EEDC", trouser: "#F2EEE6" } },
  { slug: "mehrunisa", name: "Mehrunisa", category: "formals", collections: ["festive", "signature"], price: 58000, sales: 42,
    colors: [["Deep Teal", "#5F7D78"]], fabric: "raw silk", piece: "Lehnga Set",
    art: { bg: "#DFE4D5", garment: "#5F7D78", accent: "#D9BE8E", long: true } },
  { slug: "dastaan", name: "Dastaan", category: "2-piece", collections: ["festive"], price: 9950, compare: 12950, sales: 438,
    colors: [["Powder Blue", "#A9BACB"], ["Ivory", "#EFE3CF"]], fabric: "jacquard", piece: "2 Piece",
    art: { bg: "#E9DDCB", garment: "#A9BACB", accent: "#C8A86A" } },
  { slug: "parizad", name: "Parizad", category: "luxury-pret", collections: ["signature"], price: 39500, sales: 58,
    colors: [["Rose Gold", "#D9B3A4"]], fabric: "chiffon", piece: "3 Piece",
    art: { bg: "#F3E3DD", garment: "#D9B3A4", accent: "#C8A86A", long: true } },
  { slug: "bahaar", name: "Bahaar", category: "unstitched-2-piece", collections: ["seasonal"], price: 4790, sales: 302, soldOut: true,
    colors: [["Butter", "#EFE2B0"], ["Sage", "#A7B39A"]], fabric: "lawn", piece: "Unstitched 2 Piece", unstitched: true, work: "print",
    art: { bg: "#DFE4D5", garment: "#EFE2B0", accent: "#F4F1E8" } },
  { slug: "hoorain", name: "Hoorain", category: "unstitched-3-piece", collections: ["festive"], price: 12950, sales: 117,
    colors: [["Ivory", "#EFE3CF"]], fabric: "chiffon", piece: "Unstitched 3 Piece", unstitched: true,
    art: { bg: "#E9DDCB", garment: "#EFE3CF", accent: "#C8A86A" } },
  { slug: "simin-straight-trouser", name: "Simin Straight Trouser", category: "ready-to-wear", collections: ["seasonal"], price: 3990, sales: 205,
    colors: [["Off White", "#F2ECE1"], ["Pearl Grey", "#CFCAC2"]], fabric: "cambric", piece: "Trouser", work: "hem",
    art: { bg: "#DDE5EB", fabrics: ["#F2ECE1", "#CFCAC2"], flatlay: true } },
  { slug: "benazir", name: "Benazir", category: "3-piece", collections: ["signature"], price: 21950, sales: 133,
    colors: [["Graphite", "#6B6762"]], fabric: "karandi", piece: "3 Piece",
    art: { bg: "#E9DDCB", garment: "#6B6762", accent: "#D9BE8E" } },
  { slug: "mehfil", name: "Mehfil", category: "formals", collections: ["festive", "luxury"], price: 42950, sales: 58,
    colors: [["Gold", "#D4B677"], ["Champagne", "#E6D3B3"]], fabric: "tissue", piece: "Lehnga Set", work: "gota",
    art: { bg: "#ECE4E6", garment: "#D4B677", accent: "#F4EAD5", long: true, skin: "#B88A6C" } },
  { slug: "chameli", name: "Chameli", category: "unstitched-3-piece", collections: ["seasonal"], price: 8490, sales: 177,
    colors: [["Tea Pink", "#E8C6BE"], ["Sky", "#B9CBD6"]], fabric: "lawn", piece: "Unstitched 3 Piece", unstitched: true,
    art: { bg: "#F5EFE6", garment: "#E8C6BE", accent: "#F7EDE6", skin: "#CFA486" } },
  { slug: "fiza", name: "Fiza", category: "shirts", collections: ["latest"], price: 5950, compare: 7450, sales: 287,
    colors: [["Butter", "#EFE2B0"]], fabric: "lawn", piece: "Shirt",
    art: { bg: "#F5EFE6", garment: "#EFE2B0", accent: "#F7F1DA" } },
  { slug: "raunaq", name: "Raunaq", category: "luxury-pret", collections: ["luxury", "festive"], price: 26950, compare: 33950, featured: true, sales: 124,
    colors: [["Peach", "#E7B9A2"], ["Ivory", "#EFE3CF"]], fabric: "chiffon", piece: "3 Piece", work: "tilla",
    art: { bg: "#E9DDCB", garment: "#E7B9A2", accent: "#C8A86A", long: true } },
  { slug: "nazm", name: "Nazm", category: "2-piece", collections: ["seasonal"], price: 7950, sales: 143,
    colors: [["Lavender", "#B8AEC8"], ["Sand", "#CDB79A"]], fabric: "cambric", piece: "2 Piece", work: "minimal",
    art: { bg: "#F5EFE6", garment: "#B8AEC8", accent: "#EEEAF2" } },
  { slug: "sahar", name: "Sahar", category: "2-piece", collections: ["seasonal"], price: 8450, sales: 152,
    colors: [["Aqua Mist", "#BFD8D2"]], fabric: "lawn", piece: "2 Piece",
    art: { bg: "#DFE4D5", garment: "#BFD8D2", accent: "#F4F1E8" } },
  { slug: "sanober", name: "Sanober", category: "3-piece", collections: ["signature", "luxury"], price: 21450, sales: 81,
    colors: [["Emerald", "#4E6B5D"]], fabric: "karandi", piece: "3 Piece", work: "tilla",
    art: { bg: "#E8E2DA", garment: "#4E6B5D", accent: "#D9BE8E" } },
  { slug: "gulab", name: "Gulab", category: "unstitched-3-piece", collections: ["festive"], price: 10950, sales: 119,
    colors: [["Dusty Rose", "#C98F94"], ["Ivory", "#EFE3CF"]], fabric: "chiffon", piece: "Unstitched 3 Piece", unstitched: true,
    art: { bg: "#F1E6D9", garment: "#C98F94", accent: "#C8A86A" } },
  { slug: "samar", name: "Samar", category: "unstitched-2-piece", collections: ["seasonal"], price: 4290, compare: 5490, sales: 166,
    colors: [["Pistachio", "#C5CFA6"], ["Lilac", "#CBBFD6"]], fabric: "lawn", piece: "Unstitched 2 Piece", unstitched: true, work: "print",
    art: { bg: "#F4EEDC", garment: "#C5CFA6", accent: "#F7F3E6" } },
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
  jacquard: { material: "Self-woven cotton jacquard.", feel: "self-woven cotton jacquard with a tone-on-tone motif" },
  velvet: { material: "Micro velvet with organza dupatta and raw silk trouser.", feel: "plush micro velvet with a deep, light-catching pile" },
  tissue: { material: "Tissue silk with organza dupatta.", feel: "shimmering tissue silk with a crisp, airy hand" },
};

// Embroidery / finishing copy. "threadwork" is the default.
const WORK_COPY = {
  threadwork: { short: "delicate hand-finished embroidery", long: "tonal threadwork at the neckline and a scalloped border along the hem", close: "so it reads quietly elegant by day and catches the light in the evening", detail: "Thread and sequin embroidery, hand finished" },
  gota: { short: "hand-applied gota borders", long: "hand-applied gota along the yoke and a shimmering gota border at the hem", close: "so it glows softly under fairy lights and evening lamps", detail: "Gota and kiran lace, hand applied" },
  tilla: { short: "tilla embroidery", long: "fine tilla motifs across the yoke and a tilla-worked border at the hem", close: "so it catches the light with every movement", detail: "Tilla and resham embroidery, hand finished" },
  zardozi: { short: "zardozi handwork", long: "raised zardozi and dabka on the bodice, with scattered sequins that fade towards the hem", close: "so it feels ceremonial without ever feeling heavy", detail: "Zardozi, dabka and sequins, hand embroidered" },
  sequins: { short: "scattered sequin work", long: "a starry scatter of hand-set sequins across the yoke, gathering into a dense border at the hem", close: "so it shimmers gently by candlelight", detail: "Sequins and resham, hand embellished" },
  pearl: { short: "pearl and dabka handwork", long: "hand-strung pearls and dabka tracing a jasmine trellis over the bodice", close: "so it reads understated at first glance and exquisite up close", detail: "Pearls, dabka and resham, hand embroidered" },
  mirror: { short: "mirror work", long: "tiny hand-set mirrors framed in resham at the neckline and cuffs", close: "so it brings a playful sparkle to mehndis and family dinners", detail: "Mirror and resham work, hand finished" },
  cutwork: { short: "cutwork borders", long: "cutwork scallops along the hem and sleeves, edged with fine pearl detailing", close: "so it moves with an airy, sculpted grace", detail: "Cutwork with pearl and thread detailing" },
  chikankari: { short: "chikankari-style embroidery", long: "tone-on-tone chikankari-style shadow work across the front and sleeves", close: "so it stays cool, calm and quietly refined through warm afternoons", detail: "Shadow-work embroidery, hand finished" },
  print: { short: "a soft all-over print", long: "an all-over print of trailing vines and buti motifs, with a printed border along the hem", close: "so it feels fresh and easy through long summer days", detail: "Digital print with embroidered neckline" },
  minimal: { short: "pin-tucked detailing", long: "pin tucks at the yoke, a neat piped placket and self-fabric buttons", close: "so it moves easily from desk to dinner", detail: "Pin tucks and piping, tonal buttons" },
  border: { short: "a delicate embroidered border", long: "a delicate embroidered border on all four sides and scattered buti across the body", close: "so it lifts even the simplest outfit", detail: "Embroidered border with scattered buti" },
  hem: { short: "an embroidered hem", long: "a fine embroidered band along the hem and a neatly faced waistband", close: "so it pairs effortlessly with prints and plains alike", detail: "Embroidered hem band" },
};

const BOTTOMS = new Set(["Sharara", "Gharara", "Trouser"]);

export function describe(p) {
  const f = FABRIC_COPY[p.fabric];
  const w = WORK_COPY[p.work ?? "threadwork"];
  const colour = p.colors[0][0].toLowerCase();
  const isUnstitched = Boolean(p.unstitched);
  const isDupatta = p.piece === "Dupatta";
  const isBottom = BOTTOMS.has(p.piece);
  // The fabric's feel up to its name, e.g. "breathable, fine-count cotton lawn".
  const at = f.feel.indexOf(p.fabric);
  const feelLead = (at >= 0 ? f.feel.slice(0, at + p.fabric.length) : `${f.feel.split(" ").slice(0, 3).join(" ")} ${p.fabric}`).replace(/^an? /, "");
  const short = isUnstitched
    ? `${p.piece} in ${feelLead}, with embroidered neckline panel.`
    : `${p.piece} in ${colour} ${p.fabric} with ${w.short}.`;
  const description = [
    `${p.name} is cut from ${f.feel}. The ${colour} base is finished with ${w.long}, ${w.close}.`,
    isUnstitched
      ? "Supplied as unstitched fabric so it can be tailored exactly to your measurements. Embroidered panels are pre-cut for easy stitching."
      : isDupatta
        ? "Light enough to layer over a plain kurta or a festive suit — drape it over one shoulder by day, or pin it in place for gatherings."
        : isBottom
          ? "Cut with an elasticated waist and drawstring for easy comfort. Pair with a short kurta or a matching shirt, and juttis for gatherings."
          : "Designed with a relaxed, straight silhouette that sits comfortably from morning to late evening. Pair with flats for daytime or juttis and statement jhumkas for gatherings.",
  ].join("\n\n");
  const details = isUnstitched
    ? [
        { label: "Shirt", value: "Embroidered front 1.25m, back & sleeves 1.75m" },
        ...(p.piece.includes("3") ? [{ label: "Dupatta", value: "Printed dupatta 2.5m" }] : []),
        { label: "Trouser", value: "Dyed trouser 2.5m" },
        { label: "Includes", value: "Embroidered neckline and border panels" },
      ]
    : isDupatta
      ? [
          { label: "Size", value: "2.5m x 1.1m (approx.)" },
          { label: "Embellishment", value: w.detail },
          { label: "Pieces", value: p.piece },
        ]
      : [
          { label: "Fit", value: isBottom ? "Elasticated waist with drawstring" : "Relaxed straight fit, true to size" },
          { label: "Length", value: isBottom ? "Ankle length (39 in)" : p.art.long ? "Floor length (54 in)" : p.art.short ? "Hip length (32 in)" : "Knee length (42 in)" },
          { label: "Embellishment", value: w.detail },
          { label: "Pieces", value: p.piece },
        ];
  const care = p.fabric === "lawn" || p.fabric === "cambric"
    ? "Gentle machine wash cold with similar colours. Do not bleach. Dry in shade. Iron on the reverse."
    : "Dry clean only. Store folded in a muslin cloth away from direct sunlight. Steam rather than iron embroidered areas.";
  return { short, description, material: p.material ?? f.material, care, details };
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

// address, province, postalCode, phone and country (default "PK") fill each
// customer's seeded order; orders outside Pakistan use International Shipping.
export const demoUsers = [
  { email: "hira.a@example.com", first: "Hira", last: "Ahmed", city: "Lahore", address: "House 24-B, Street 7, Gulberg III", province: "Punjab", postalCode: "54660", phone: "+92 321 4567890" },
  { email: "sana.k@example.com", first: "Sana", last: "Khan", city: "Karachi", address: "Plot 31-C, Khayaban-e-Ittehad, DHA Phase 6", province: "Sindh", postalCode: "75500", phone: "+92 300 8241176" },
  { email: "maryam.r@example.com", first: "Maryam", last: "Raza", city: "London", address: "14 Ealing Road", postalCode: "W5 4QA", country: "GB", phone: "+44 7700 900123" },
  { email: "ayesha.m@example.com", first: "Ayesha", last: "Malik", city: "Islamabad", address: "House 12, Street 18, F-7/2", province: "Islamabad Capital Territory", postalCode: "44000", phone: "+92 345 5123987" },
  { email: "zainab.h@example.com", first: "Zainab", last: "Hussain", city: "Dubai", address: "Apt 1203, Marina Gate 2, Dubai Marina", country: "AE", phone: "+971 50 555 0142" },
  { email: "fatima.s@example.com", first: "Fatima", last: "Sheikh", city: "Multan", address: "House 9, Gulgasht Colony", province: "Punjab", postalCode: "60700", phone: "+92 302 6457812" },
  { email: "amna.q@example.com", first: "Amna", last: "Qureshi", city: "Faisalabad", address: "House 118, Block D, Peoples Colony No. 1", province: "Punjab", postalCode: "38000", phone: "+92 311 7654320" },
  { email: "mahnoor.b@example.com", first: "Mahnoor", last: "Butt", city: "Lahore", address: "House 55, Block K, Model Town", province: "Punjab", postalCode: "54700", phone: "+92 322 4419087" },
  { email: "rabia.c@example.com", first: "Rabia", last: "Chaudhry", city: "Rawalpindi", address: "House 7, Street 12, Bahria Town Phase 4", province: "Punjab", postalCode: "46220", phone: "+92 334 5098761" },
  { email: "iqra.n@example.com", first: "Iqra", last: "Naqvi", city: "Karachi", address: "Flat B-14, Block 13-D, Gulshan-e-Iqbal", province: "Sindh", postalCode: "75300", phone: "+92 315 2290348" },
  { email: "hafsa.f@example.com", first: "Hafsa", last: "Farooq", city: "Peshawar", address: "House 21, Street 5, Hayatabad Phase 3", province: "Khyber Pakhtunkhwa", postalCode: "25100", phone: "+92 333 9187453" },
  { email: "sadia.j@example.com", first: "Sadia", last: "Javed", city: "Sialkot", address: "House 40, Street 2, Defence Road", province: "Punjab", postalCode: "51310", phone: "+92 303 6129875" },
  { email: "komal.i@example.com", first: "Komal", last: "Iqbal", city: "Hyderabad", address: "House 16, Unit 6, Latifabad", province: "Sindh", postalCode: "71000", phone: "+92 300 3015642" },
  { email: "areeba.t@example.com", first: "Areeba", last: "Tariq", city: "Karachi", address: "House 88, Block 2, PECHS", province: "Sindh", postalCode: "75400", phone: "+92 321 2765098" },
  { email: "laiba.k@example.com", first: "Laiba", last: "Khalid", city: "Lahore", address: "House 302, Block G, Johar Town", province: "Punjab", postalCode: "54782", phone: "+92 336 4876210" },
  { email: "mehwish.a@example.com", first: "Mehwish", last: "Akram", city: "Gujranwala", address: "House 14, Block C, Satellite Town", province: "Punjab", postalCode: "52250", phone: "+92 300 6458213" },
  { email: "saima.r@example.com", first: "Saima", last: "Rehman", city: "Islamabad", address: "House 3, Street 31, G-10/1", province: "Islamabad Capital Territory", postalCode: "44000", phone: "+92 345 5307719" },
];

// [userIndex, productSlug, rating, title, content, verified] — one review per
// customer per product (the database enforces it).
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
  [6, "dastaan", 5, "The jacquard is beautiful", "The weave has a lovely tone-on-tone motif that looks far more expensive than it is. Wore it to a dholki and my aunts kept touching the fabric.", true],
  [7, "dastaan", 4, "Lovely, runs a little roomy", "Gorgeous colour against the ivory trouser. I usually wear a medium but could have gone down a size, so check the measurements first.", true],
  [11, "dastaan", 5, "Bought a second one", "Came back for another as a gift for my sister. The stitching is neat and the shirt has kept its shape after several washes.", true],
  [3, "dastaan", 4, "Elegant for the price", "Simple and graceful, and the jacquard has a subtle sheen in daylight. The trouser could be a touch longer.", false],
  [8, "marjaan", 5, "Perfect summer two piece", "The coral is so cheerful and the lawn is genuinely breathable — I wore it through a 40-degree day in Pindi without feeling sticky.", true],
  [12, "marjaan", 4, "Pretty print", "The print is crisp and the colour is true to the photos. Neckline embroidery is minimal, which I actually prefer for daily wear.", true],
  [9, "ghazal", 5, "That pink!", "The rani pink is rich without being loud, and the little mirrors at the neckline catch the light. Paired it with an ivory sharara for my cousin’s mayun.", true],
  [10, "yaqoot", 5, "Worth the splurge", "The velvet is soft and substantial, and the zardozi is exquisite up close. I wore it for my walima and the colour photographed like a jewel.", true],
  [5, "motia", 5, "Stitched beautifully", "My tailor said it was a pleasure to work with. The lawn is fine and the shadow-work panel is placed perfectly. So cool to wear.", true],
  [13, "motia", 4, "Lovely, slightly sheer", "Gorgeous off-white with a soft sage dupatta. The shirt fabric is a little sheer so I had it lined. Took three days to reach Karachi.", true],
  [6, "motia", 5, "Summer favourite", "Light, elegant and it looks so put together. I get compliments every time I wear it to work.", false],
  [15, "afreen", 4, "Great cambric", "Opaque, crisp cambric, no lining needed. The olive is earthy and very wearable. One star off because the printed border was narrower than I expected.", true],
  [2, "nastaran", 5, "Dreamy organza", "The ivory organza with the blush dupatta is so romantic. Ordered to London and it arrived within a week, packed in a box with tissue.", true],
  [8, "nastaran", 5, "So many compliments", "The gota work is fine and not at all scratchy. Wore it to a nikkah and three people asked where it was from.", true],
  [11, "nastaran", 4, "Beautiful, delicate", "Lovely suit. The organza needs careful handling — I steam it rather than iron. Sizing is accurate.", false],
  [13, "zafran-gharara", 5, "Instant festive outfit", "Paired it with a plain ivory kurta and a gota dupatta for a mehndi and it looked like a full designer outfit. The waistband stayed comfortable all night.", true],
  [14, "banafsha", 5, "Such an elegant violet", "An unusual, grown-up shade of violet. The floor-length flare moves beautifully and the inside is finished as neatly as the outside.", true],
  [4, "darya", 4, "Easy linen set", "Relaxed fit and the steel blue is very chic. Linen creases, as expected, but that is part of the charm.", true],
  [10, "darya", 5, "Travel favourite", "Wore it on a flight to Islamabad and straight to lunch, and it still looked smart. The trousers sit comfortably all day.", true],
  [1, "gulshan", 5, "Sold out for a reason", "Soft lawn, a pretty sage print and it has washed well. I wish I had bought the peach one too.", true],
  [9, "gulshan", 4, "Comfortable everyday wear", "Light and comfortable, and the shirt length is just right. The colour is slightly more muted in person.", true],
  [13, "tasneem", 4, "Sweet summer shirt", "Simple, airy and the lilac shade is lovely. Good value in the sale.", false],
  [3, "arghavan", 5, "Regal colour", "The plum is stunning in person and the tilla work has real weight to it. I felt like royalty at my brother’s baraat.", true],
  [15, "zohra", 4, "Lovely chiffon set", "The sequin panel is beautiful and the chiffon is good quality. Make sure your tailor adds a lining because the shirt is sheer.", true],
  [6, "shehnai", 5, "Wedding season staple", "The teal with the gold dupatta is a perfect combination. The raw silk feels rich and didn’t crease after a long evening.", true],
  [12, "shehnai", 5, "Exactly as pictured", "Colour, embroidery and fit are exactly like the website. Very happy with this one.", true],
  [10, "gulzar", 4, "Cheerful print", "Mint and coral is such a happy combination. The lawn is soft; the trouser fabric is a little thinner than the shirt.", true],
  [7, "huma", 5, "Pure elegance", "The ivory chiffon is so graceful and the gold work is delicate rather than flashy. Wore it to a formal dinner and felt wonderful.", true],
  [11, "huma", 5, "Beautiful finishing", "Even the inside seams are finished neatly. You can tell it was made with care.", true],
  [9, "laaleh", 4, "Chic co-ord", "Love the cut, and the tea pink is very flattering. The sleeves run slightly long on me.", true],
  [7, "kashish", 5, "My go-to kurta", "The mustard is warm and pretty, and the cambric is crisp but soft. Gutted it has sold out — please restock!", true],
  [16, "kashish", 3, "Nice, but size up", "Lovely colour and fabric, but the shoulders are a bit narrow. I would order one size up next time.", true],
  [16, "bahaar", 5, "Fresh and light", "The butter yellow is so pretty for summer and the print is very fine. My tailor loved working with it.", true],
  [12, "simin-straight-trouser", 4, "Good basic trouser", "Straight cut, opaque and goes with everything. Would love more colours.", true],
  [14, "mehfil", 5, "Breathtaking tissue", "The gold tissue shimmers without looking brassy. Wore it for my sister’s mehndi night and it photographed beautifully.", true],
  [6, "chameli", 4, "Pretty tea pink", "Soft lawn and neat embroidery. The dupatta is a little short for my liking but overall lovely.", false],
  [4, "raunaq", 5, "Great find in the sale", "Couldn’t believe the quality for the sale price — the peach chiffon is lined and the gold work is so fine.", true],
  [8, "raunaq", 4, "Lovely flare", "The floor-length flare is gorgeous. It’s a touch long for me at 5’2” so I had it hemmed.", true],
  [11, "nazm", 5, "Office favourite", "Lavender cambric with a neat finish. Smart enough for work and comfortable through a long day.", true],
  [9, "sanober", 5, "Winter elegance", "Warm karandi in a deep green — exactly what I wanted for winter weddings. It feels substantial and luxurious.", true],
  [14, "gulab", 4, "Beautiful colour", "The rose shade is lovely and the chiffon drapes well. The embroidered border is the highlight.", true],
  [5, "samar", 4, "Good everyday lawn", "Pistachio is such a fresh colour and the lawn is soft. Value for money in the sale.", false],
  [15, "mehrunisa", 5, "Timeless and regal", "The deep teal and gold is timeless, and the lehnga has a beautiful weight and flare. It fit perfectly using the standard size chart.", true],
  [16, "hoorain", 4, "Elegant ivory chiffon", "Beautiful, delicate chiffon and the embroidered panels are generous. It does need a good tailor.", true],
  [12, "anaya", 5, "Lovely sky blue", "Such a calming colour and the lawn is soft. Great price for the quality.", true],
  [16, "rubaab", 5, "Champagne perfection", "Elegant and light, and the organza held its shape all evening. Worth it for special occasions.", true],
  [6, "sahar", 4, "Easy summer suit", "Pretty aqua shade and very comfortable. The shirt is slightly longer than I expected but I like it.", true],
  [15, "zoya", 5, "Comfortable linen co-ord", "The lilac linen is soft and relaxed, and I wear the pieces separately too.", true],
  [14, "sitara-sharara", 5, "Flowy and fun", "So much movement in this sharara and the waist is comfortable. Wore it with the Sitara kurta.", true],
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

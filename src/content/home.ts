/**
 * Homepage merchandising. Swap images/copy/links here for each campaign —
 * products themselves always come live from Supabase.
 */
export type ArtImage = { desktop: string; mobile: string; alt: string };

export const heroSlides: {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
  image: ArtImage;
}[] = [
  {
    eyebrow: "Eid Festive ’26",
    title: "The Festive Edit",
    subtitle: "An expression of timeless elegance.",
    cta: { label: "Shop the Collection", href: "/collections/festive" },
    image: { desktop: "/images/campaigns/hero-festive.jpg", mobile: "/images/campaigns/hero-festive-mobile.jpg", alt: "Two models in ivory and blush festive suits beneath a carved Mughal arch" },
  },
  {
    eyebrow: "Luxury Pret",
    title: "Mehr-o-Mah",
    subtitle: "Moonlit hues, hand-finished in Lahore.",
    cta: { label: "Discover Luxury Pret", href: "/collections/luxury" },
    image: { desktop: "/images/campaigns/hero-luxury.jpg", mobile: "/images/campaigns/hero-luxury-mobile.jpg", alt: "Models in powder blue and ivory luxury pret" },
  },
  {
    eyebrow: "Unstitched",
    title: "Summer Lawn Vol. II",
    subtitle: "Breathable prints for long, golden days.",
    cta: { label: "Shop Unstitched", href: "/collections/seasonal" },
    image: { desktop: "/images/campaigns/hero-lawn.jpg", mobile: "/images/campaigns/hero-lawn-mobile.jpg", alt: "Model in a sage lawn suit in soft daylight" },
  },
];

export const featuredCollections = {
  lead: {
    eyebrow: "Eid Festive ’26",
    title: "The Festive Edit",
    text: "Gold-thread organza, tilla and gota for the season of gatherings.",
    href: "/collections/festive",
    image: "/images/campaigns/story-festive.jpg",
    alt: "Model in an ivory organza festive suit",
  },
  secondary: [
    { title: "Mehr-o-Mah", text: "Luxury pret in moonlit pastels.", href: "/collections/luxury", image: "/images/campaigns/story-luxury.jpg", alt: "Two models in powder blue and ivory luxury pret" },
    { title: "Summer Lawn Vol. II", text: "Unstitched three-piece prints.", href: "/collections/seasonal", image: "/images/campaigns/story-lawn.jpg", alt: "Two models in sage and blush lawn suits" },
  ],
};

export const categoryTiles = [
  { name: "Ready to Wear", href: "/category/ready-to-wear", image: "/images/categories/ready-to-wear.jpg" },
  { name: "Unstitched", href: "/category/unstitched", image: "/images/categories/unstitched.jpg" },
  { name: "Luxury Pret", href: "/category/luxury-pret", image: "/images/categories/luxury-pret.jpg" },
  { name: "Formal", href: "/category/formals", image: "/images/categories/formals.jpg" },
  { name: "Co-ords", href: "/category/co-ords", image: "/images/categories/co-ords.jpg" },
  { name: "Festive", href: "/collections/festive", image: "/images/collections/festive.jpg" },
];

export const editorialBanner = {
  eyebrow: "New Season",
  title: "A Study in Elegance",
  text: "Hand-embroidered raw silk and chiffon, cut for the long evenings of the wedding season.",
  cta: { label: "Discover the Collection", href: "/category/formals" },
  image: { desktop: "/images/campaigns/editorial.jpg", mobile: "/images/campaigns/editorial-mobile.jpg", alt: "Two models in ivory and rose formals against a sage arch" },
};

export const shopTheLook = {
  title: "Ivory & Gold, Day to Dusk",
  text: "An embroidered kurta, a whisper-light organza dupatta and a flowing sharara. Wear them together, or apart.",
  image: "/images/campaigns/look.jpg",
  alt: "Model wearing the Sitara kurta, organza dupatta and sharara",
  items: [
    { slug: "sitara-kurta", hotspot: { x: 46, y: 52 } },
    { slug: "sitara-organza-dupatta", hotspot: { x: 62, y: 44 } },
    { slug: "sitara-sharara", hotspot: { x: 47, y: 86 } },
  ],
};

export const collectionSpotlight = {
  eyebrow: "The Signature Collection",
  title: "Crafted for Every Celebration",
  text: "Each Signature piece passes through the hands of our karigars for up to 120 hours — from hand-drawn motifs to zardozi and finishing. Heirlooms, made for now.",
  facts: [
    { value: "120", label: "Hours of handwork" },
    { value: "24", label: "Limited styles" },
    { value: "Lahore", label: "Atelier made" },
  ],
  cta: { label: "Explore Collection", href: "/collections/signature" },
  image: "/images/campaigns/spotlight.jpg",
  alt: "Model in an ivory signature suit beneath an arch",
};

/** Vertical campaign films. Add `video` (mp4/webm URL) when available; the poster is shown until then. */
export const watchAndShop: { slug: string; poster: string; duration: string; video?: string }[] = [
  { slug: "neelofar", poster: "/images/campaigns/reel-1.jpg", duration: "0:18" },
  { slug: "shirin", poster: "/images/campaigns/reel-2.jpg", duration: "0:24" },
  { slug: "zarrin", poster: "/images/campaigns/reel-3.jpg", duration: "0:15" },
  { slug: "rukhsana", poster: "/images/campaigns/reel-4.jpg", duration: "0:21" },
];

export const gallery = {
  handle: "@auraq.official",
  images: [1, 2, 3, 4, 5, 6].map((i) => ({ src: `/images/gallery/edit-${i}.jpg`, alt: `AURAQ styled look ${i}` })),
};

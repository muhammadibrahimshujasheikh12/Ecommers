/**
 * Primary navigation & mega menus. Labels and links can be adapted to the
 * client's catalogue without touching components.
 */
export type NavLink = { label: string; href: string };
export type MegaMenu = {
  columns: { title: string; links: NavLink[] }[];
  features: { title: string; subtitle: string; href: string; image: string; alt: string }[];
};
export type NavItem = { label: string; href: string; highlight?: boolean; mega?: MegaMenu };

const shopByCollection: NavLink[] = [
  { label: "Latest Collection", href: "/collections/latest" },
  { label: "Festive", href: "/collections/festive" },
  { label: "Luxury", href: "/collections/luxury" },
  { label: "Seasonal", href: "/collections/seasonal" },
  { label: "Signature", href: "/collections/signature" },
];

const shopByCategory: NavLink[] = [
  { label: "3 Piece", href: "/category/3-piece" },
  { label: "2 Piece", href: "/category/2-piece" },
  { label: "Shirts", href: "/category/shirts" },
  { label: "Co-ords", href: "/category/co-ords" },
  { label: "Luxury Pret", href: "/category/luxury-pret" },
  { label: "Formal Wear", href: "/category/formals" },
];

const discover: NavLink[] = [
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Best Sellers", href: "/shop?sort=best_selling" },
  { label: "Under Rs. 10,000", href: "/shop?max=10000" },
  { label: "Sale", href: "/shop?sale=1" },
];

export const mainNav: NavItem[] = [
  { label: "New In", href: "/shop?sort=newest" },
  {
    label: "Ready to Wear",
    href: "/category/ready-to-wear",
    mega: {
      columns: [
        { title: "Shop by Category", links: shopByCategory },
        { title: "Shop by Collection", links: shopByCollection },
        { title: "Discover", links: [{ label: "Shop All Ready to Wear", href: "/category/ready-to-wear" }, ...discover] },
      ],
      features: [
        { title: "The Festive Edit", subtitle: "Shop the campaign", href: "/collections/festive", image: "/images/campaigns/mega-festive.jpg", alt: "Models in ivory and blush festive suits under an arch" },
        { title: "Mehr-o-Mah Luxury", subtitle: "New season", href: "/collections/luxury", image: "/images/campaigns/mega-luxury.jpg", alt: "Model in a powder blue luxury pret suit" },
      ],
    },
  },
  {
    label: "Unstitched",
    href: "/category/unstitched",
    mega: {
      columns: [
        {
          title: "Shop by Category",
          links: [
            { label: "Unstitched 3 Piece", href: "/category/unstitched-3-piece" },
            { label: "Unstitched 2 Piece", href: "/category/unstitched-2-piece" },
            { label: "Shop All Unstitched", href: "/category/unstitched" },
          ],
        },
        { title: "Shop by Collection", links: shopByCollection },
        { title: "Discover", links: discover },
      ],
      features: [
        { title: "Summer Lawn Vol. II", subtitle: "Unstitched prints", href: "/collections/seasonal", image: "/images/categories/unstitched.jpg", alt: "Folded unstitched lawn fabrics" },
        { title: "The Signature Collection", subtitle: "Limited pieces", href: "/collections/signature", image: "/images/collections/signature.jpg", alt: "Model in a lavender signature suit" },
      ],
    },
  },
  {
    label: "Formals",
    href: "/category/formals",
    mega: {
      columns: [
        { title: "Shop by Category", links: [{ label: "Formal Wear", href: "/category/formals" }, { label: "Luxury Pret", href: "/category/luxury-pret" }, { label: "3 Piece", href: "/category/3-piece" }] },
        { title: "Shop by Collection", links: shopByCollection },
        { title: "Discover", links: discover },
      ],
      features: [
        { title: "A Study in Elegance", subtitle: "New season formals", href: "/category/formals", image: "/images/categories/formals.jpg", alt: "Model in a plum formal pishwas" },
        { title: "The Festive Edit", subtitle: "Shop the campaign", href: "/collections/festive", image: "/images/campaigns/mega-festive.jpg", alt: "Models in festive suits" },
      ],
    },
  },
  {
    label: "Collections",
    href: "/collections",
    mega: {
      columns: [
        { title: "Shop by Collection", links: shopByCollection },
        { title: "Shop by Category", links: shopByCategory },
        { title: "Discover", links: [{ label: "All Collections", href: "/collections" }, ...discover] },
      ],
      features: [
        { title: "The Signature Collection", subtitle: "Crafted for every celebration", href: "/collections/signature", image: "/images/collections/signature.jpg", alt: "Model in a lavender signature suit" },
        { title: "Summer Lawn Vol. II", subtitle: "Seasonal", href: "/collections/seasonal", image: "/images/collections/seasonal.jpg", alt: "Models in sage and blush lawn suits" },
      ],
    },
  },
  { label: "Best Sellers", href: "/shop?sort=best_selling" },
  { label: "Sale", href: "/shop?sale=1", highlight: true },
];

export const footerNav = {
  shop: [
    { label: "New Arrivals", href: "/shop?sort=newest" },
    { label: "Ready to Wear", href: "/category/ready-to-wear" },
    { label: "Unstitched", href: "/category/unstitched" },
    { label: "Collections", href: "/collections" },
    { label: "Best Sellers", href: "/shop?sort=best_selling" },
  ],
  care: [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "/faqs" },
    { label: "Shipping Policy", href: "/shipping-policy" },
    { label: "Return Policy", href: "/return-policy" },
    { label: "Cancellation Policy", href: "/cancellation-policy" },
    { label: "Track Order", href: "/track-order" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms-and-conditions" },
  ],
} satisfies Record<string, NavLink[]>;

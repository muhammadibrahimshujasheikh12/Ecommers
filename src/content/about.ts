/**
 * "Our Story" page copy. Edit freely: the About page renders entirely from
 * this file. Figures are demo values; replace them with audited numbers.
 */
import type { ArtImage } from "@/content/home";

export type EditorialImage = { src: string; alt: string };

export const aboutHero: { eyebrow: string; title: string; text: string; image: ArtImage } = {
  eyebrow: "Our Story",
  title: "Made by Hand, in Lahore",
  text: "AURAQ began in 2015 with a single embroidery frame in a Gulberg courtyard. Today our atelier is home to more than two hundred karigars, and every piece still passes through their hands.",
  image: {
    desktop: "/images/pages/about-hero.jpg",
    mobile: "/images/pages/about-hero-mobile.jpg",
    alt: "Two models in ivory and dusty rose embroidered suits standing beneath a carved Mughal arch",
  },
};

export const aboutIntro = {
  urdu: "اوراق",
  lead: "In Urdu, auraq means pages.",
  text: "We chose the name because every collection is a page in a much longer story: the story of Lahore’s craft, passed from ustad to apprentice for five centuries, and of the women who wear it to weddings, Eid lunches and ordinary Tuesdays. We just try to write each page well.",
};

export const founderNote = {
  eyebrow: "A Note from Our Founder",
  title: "Craft Was Never Meant to Be Rushed",
  paragraphs: [
    "I grew up in my nani’s house in Model Town, where every wedding season began the same way: bolts of silk spread across the floor, a karigar sitting cross-legged on the veranda, and weeks of quiet, careful work before anyone wore a thing. I didn’t know it then, but I was watching the most patient art form I would ever encounter.",
    "When I started AURAQ in 2015, it was with one master karigar, Ustad Bashir Ahmed, and one wooden adda. We made twelve pieces that first season. They took far longer than any business plan allowed, and every one of them sold to a woman who wrote back to tell us where she had worn it.",
    "We are much bigger now, but the principle hasn’t changed. Our designs are drawn around what our karigars do best, not the other way round. We buy fabric we would wear ourselves, we cut for real bodies, and we pay the people who make our clothes properly, every month, whether the season is busy or slow.",
    "Thank you for wearing our pages. We hope they become part of yours.",
  ],
  signature: "Alizeh Rashid",
  role: "Founder & Creative Director",
  image: {
    src: "/images/pages/founder.jpg",
    alt: "AURAQ founder Alizeh Rashid in an ivory kurta with a gold-edged dupatta over one shoulder",
  } satisfies EditorialImage,
};

export const atelier = {
  eyebrow: "The Lahore Atelier",
  title: "Eleven Frames in Gulberg, Two Hundred Pairs of Hands",
  paragraphs: [
    "Our atelier sits above the flagship on MM Alam Road. On the first floor, pattern cutters and tailors work beside the fabric store; on the second, beneath a row of tall windows, eleven wooden addas hold lengths of silk stretched taut as drums.",
    "Our master karigars work here. The rest of our artisans work in three smaller workshops in the walled city, Shahdara and Kasur, close to home and held to exactly the same standards. Many come from families who have embroidered for generations. All are salaried, insured and credited by name on every Signature piece, and twelve apprentices at a time train beside them on our two-year programme.",
  ],
  image: {
    src: "/images/pages/atelier.jpg",
    alt: "Cut lengths of wine, ivory and emerald raw silk laid out on the atelier table, ready for embroidery",
  } satisfies EditorialImage,
};

export const craftTechniques: { name: string; urdu: string; text: string; image: EditorialImage }[] = [
  {
    name: "Zardozi",
    urdu: "زردوزی",
    text: "Once reserved for the Mughal court, zardozi is metal-thread embroidery at its most sculptural. Coils of gold and silver wire (dabka, naqshi, kora and salma) are cut, threaded and couched onto silk by hand, building raised motifs that catch the light from every angle.",
    image: { src: "/images/pages/craft-zardozi.jpg", alt: "Wine raw silk shirt with a raised gold zardozi yoke" },
  },
  {
    name: "Tilla",
    urdu: "تلہ",
    text: "Fine metallic thread laid flat across the surface and anchored with tiny, almost invisible stitches. Where zardozi is sculpted, tilla is liquid: a soft, continuous shimmer that adds almost no weight, which is why we choose it for organza and chiffon.",
    image: { src: "/images/pages/craft-tilla.jpg", alt: "Violet organza shirt with soft gold tilla embroidery at the neckline" },
  },
  {
    name: "Gota",
    urdu: "گوٹا",
    text: "Woven ribbons of gold or silver, folded, cut and hand-applied into borders, florals and geometric jaals. Gota has dressed Punjabi brides for centuries, and nothing moves quite like it: a gota hem glints with every step.",
    image: { src: "/images/pages/craft-gota.jpg", alt: "Ivory organza shirt edged with hand-applied gold gota borders" },
  },
  {
    name: "Resham",
    urdu: "ریشم",
    text: "Silk-floss embroidery worked in satin and long-and-short stitch, so finely shaded that our florals look painted. We dye resham in small lots each season to match the palette exactly, sometimes using forty shades on a single shirt.",
    image: { src: "/images/pages/craft-resham.jpg", alt: "Swatches of blush, sage and ivory silk embroidered with resham borders" },
  },
  {
    name: "Mukesh",
    urdu: "مکیش",
    text: "Also called badla or fardi work: slim strips of flattened metal are threaded through the cloth, twisted and pressed by hand into tiny glinting dots. A single mukesh dupatta can carry several thousand of them, scattered like stars on a night sky.",
    image: { src: "/images/pages/craft-mukesh.jpg", alt: "Midnight blue chiffon shirt with silver mukesh detailing at the neckline" },
  },
];

export const aboutNumbers: { value: string; label: string; note: string }[] = [
  { value: "200+", label: "Karigars & artisans", note: "Salaried and insured, in our Lahore atelier" },
  { value: "380k", label: "Hours of handwork", note: "Embroidered by hand every year" },
  { value: "190+", label: "Cities delivered to", note: "Across Pakistan and seven countries" },
  { value: "5", label: "Boutiques", note: "In Lahore, Karachi, Islamabad and Dubai" },
];

export const aboutValues: { icon: "craft" | "fabric" | "fit" | "responsible"; title: string; text: string }[] = [
  {
    icon: "craft",
    title: "Craft First",
    text: "Handwork is never an afterthought. Every collection begins at the embroidery frame, and our designers draw around what our karigars do best.",
  },
  {
    icon: "fabric",
    title: "Honest Fabric",
    text: "Fine-count lawn, raw silk with a true slub, organza you can see light through. The full composition of every piece is listed on its product page.",
  },
  {
    icon: "fit",
    title: "Cut for Real Bodies",
    text: "Patterns are graded from XS to XL on fit models and tested in motion: sitting, walking, dancing at a mehndi. Alterations are complimentary in our boutiques.",
  },
  {
    icon: "responsible",
    title: "Responsible Making",
    text: "Fixed monthly wages and health cover for every artisan, offcuts reworked into potlis and piping, and muslin and recycled-paper packaging.",
  },
];

export const aboutProcess: { step: string; title: string; duration: string; text: string }[] = [
  {
    step: "01",
    title: "Sketch",
    duration: "Weeks 1–3",
    text: "Every collection starts as pencil on paper, with motifs drawn from carved jaali screens, old Lahore havelis and the Shalimar gardens. The final design is traced onto butter paper and pricked by hand for transfer.",
  },
  {
    step: "02",
    title: "Fabric",
    duration: "Weeks 3–5",
    text: "Base cloths are sampled, washed and tested for drape, shrinkage and colour-fastness before a metre is cut. Each shade is then dyed in small lots and matched to the swatch by eye, in daylight.",
  },
  {
    step: "03",
    title: "Embroidery",
    duration: "Up to 120 hours",
    text: "The fabric is stretched on the adda and our karigars begin, in zardozi, tilla, gota, resham or mukesh. A single Signature shirt can take five weeks and pass through four pairs of hands.",
  },
  {
    step: "04",
    title: "Finishing",
    duration: "The final 48 hours",
    text: "Panels are steamed from the back, stitched and pressed, then checked under daylight lamps with every thread trimmed and every border measured. Each piece is wrapped in muslin with a handwritten care card.",
  },
];

export const aboutCta: { eyebrow: string; title: string; text: string; primary: { label: string; href: string }; secondary: { label: string; href: string }; image: ArtImage } = {
  eyebrow: "Wear the Story",
  title: "The Next Page Is Yours",
  text: "Discover the collections our atelier is working on now, or visit a boutique to see the handwork up close.",
  primary: { label: "Explore Collections", href: "/collections" },
  secondary: { label: "Find a Boutique", href: "/stores" },
  image: {
    desktop: "/images/pages/about-cta.jpg",
    mobile: "/images/pages/about-cta-mobile.jpg",
    alt: "Two models in ivory and lavender suits beneath an arch in soft evening light",
  },
};

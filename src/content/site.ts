/** Brand & business details used across the site, metadata and structured data. */
export const site = {
  name: "AURAQ",
  legalName: "AURAQ (Private) Limited",
  tagline: "Contemporary Pakistani luxury",
  description:
    "AURAQ — contemporary Pakistani luxury pret, formals and unstitched fabrics, crafted in our Lahore atelier. Shop new arrivals, festive collections and best sellers with nationwide and worldwide delivery.",
  locale: "en_PK",
  currency: "PKR",
  freeShippingThreshold: 5000,
  contact: {
    phone: "+92 42 111 287 727",
    phoneHref: "tel:+9242111287727",
    whatsapp: "https://wa.me/923000287727",
    email: "care@auraq.pk",
    address: {
      street: "14-C, MM Alam Road, Gulberg III",
      city: "Lahore",
      region: "Punjab",
      postalCode: "54660",
      country: "PK",
    },
    hours: "Mon–Sat, 10am–8pm PKT",
  },
  social: {
    instagram: "https://instagram.com/auraq.official",
    facebook: "https://facebook.com/auraq.official",
    tiktok: "https://tiktok.com/@auraq.official",
    pinterest: "https://pinterest.com/auraqofficial",
  },
  announcements: [
    "Complimentary delivery on orders above Rs. 5,000",
    "Worldwide shipping to 7 countries",
    "The Festive Edit — now live",
  ],
} as const;

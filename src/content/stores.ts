/**
 * Boutiques shown on the Store Locator (/stores). Hours use 24-hour "HH:MM"
 * strings; "24:00" means midnight. Phone numbers and unit numbers are demo
 * values. Replace them with the real store details before launch.
 */

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export type StoreService = "stitching" | "alterations" | "styling" | "couture" | "collect" | "taxfree";

export type StoreHours = {
  /** Row label, e.g. "Monday – Thursday". */
  label: string;
  days: DayOfWeek[];
  /** One or more [opens, closes] pairs; two pairs = a midday break. */
  slots: [string, string][];
};

export type Store = {
  id: string;
  name: string;
  city: string;
  country: string;
  flagship?: boolean;
  description: string;
  address: { lines: string[]; locality: string; region: string; postalCode?: string; countryCode: "PK" | "AE" };
  /** Free-text query for the Google Maps "Get directions" link. */
  mapsQuery: string;
  phone: string;
  phoneHref: string;
  email: string;
  hours: StoreHours[];
  hoursNote?: string;
  services: StoreService[];
  image: { src: string; alt: string };
};

export const storeServices: Record<StoreService, { label: string; text: string }> = {
  stitching: { label: "Bespoke stitching", text: "Unstitched fabric tailored to your measurements in 7–10 days." },
  alterations: { label: "Alterations", text: "Complimentary hem and sleeve adjustments on AURAQ pieces." },
  styling: { label: "Personal styling", text: "One-to-one appointments with our in-store stylists." },
  couture: { label: "Couture salon", text: "Private consultations for Signature and wedding-season pieces." },
  collect: { label: "Click & collect", text: "Order online and collect in store within 48 hours." },
  taxfree: { label: "Tax-free shopping", text: "VAT refunds for eligible visitors to the UAE." },
};

const SAT_TO_THU: DayOfWeek[] = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const MON_TO_THU: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday"];
const JUMMAH = "Closed for Jummah prayers, 1pm – 2:30pm on Fridays.";

/** Standard Pakistan mall hours, with the Friday Jummah break. */
const mallHours: StoreHours[] = [
  { label: "Monday – Thursday", days: MON_TO_THU, slots: [["11:00", "22:00"]] },
  { label: "Friday", days: ["Friday"], slots: [["11:00", "13:00"], ["14:30", "22:00"]] },
  { label: "Saturday – Sunday", days: ["Saturday", "Sunday"], slots: [["11:00", "23:00"]] },
];

export const stores: Store[] = [
  {
    id: "lahore-flagship",
    name: "MM Alam Road Flagship",
    city: "Lahore",
    country: "Pakistan",
    flagship: true,
    description:
      "Our home since 2018: three floors in a restored Gulberg townhouse with the full collection, the Signature couture salon and a glass wall onto the embroidery room upstairs.",
    address: { lines: ["14-C, MM Alam Road", "Gulberg III"], locality: "Lahore", region: "Punjab", postalCode: "54660", countryCode: "PK" },
    mapsQuery: "14-C MM Alam Road, Gulberg III, Lahore",
    phone: "+92 42 3575 0287",
    phoneHref: "tel:+924235750287",
    email: "flagship@auraq.pk",
    hours: [
      { label: "Saturday – Thursday", days: SAT_TO_THU, slots: [["11:00", "22:00"]] },
      { label: "Friday", days: ["Friday"], slots: [["11:00", "13:00"], ["14:30", "22:00"]] },
    ],
    hoursNote: JUMMAH,
    services: ["couture", "stitching", "alterations", "styling", "collect"],
    image: {
      src: "/images/pages/store-lahore-flagship.jpg",
      alt: "Window of the AURAQ MM Alam Road flagship: two mannequins in ivory and rose suits framed by a carved arch",
    },
  },
  {
    id: "lahore-emporium",
    name: "Emporium Mall",
    city: "Lahore",
    country: "Pakistan",
    description:
      "A light-filled boutique on the ground floor, with ready to wear, luxury pret and the newest unstitched prints, plus a dedicated stitching counter.",
    address: { lines: ["Unit G-24, Ground Floor, Emporium Mall", "Abdul Haque Road, Johar Town"], locality: "Lahore", region: "Punjab", postalCode: "54782", countryCode: "PK" },
    mapsQuery: "Emporium Mall, Abdul Haque Road, Johar Town, Lahore",
    phone: "+92 42 3530 0287",
    phoneHref: "tel:+924235300287",
    email: "emporium@auraq.pk",
    hours: mallHours,
    hoursNote: JUMMAH,
    services: ["stitching", "alterations", "styling", "collect"],
    image: {
      src: "/images/pages/store-lahore-emporium.jpg",
      alt: "AURAQ Emporium Mall boutique arch with a mannequin in a sage lawn suit",
    },
  },
  {
    id: "karachi-dolmen",
    name: "Dolmen Mall Clifton",
    city: "Karachi",
    country: "Pakistan",
    description:
      "Our Karachi home, a short walk from the sea front, with festive and formal edits chosen for the city’s wedding season and a private styling room.",
    address: { lines: ["Unit 118, First Floor, Dolmen Mall Clifton", "HC-3, Block 4, Marine Drive, Clifton"], locality: "Karachi", region: "Sindh", postalCode: "75600", countryCode: "PK" },
    mapsQuery: "Dolmen Mall Clifton, Marine Drive, Karachi",
    phone: "+92 21 3529 0287",
    phoneHref: "tel:+922135290287",
    email: "clifton@auraq.pk",
    hours: mallHours,
    hoursNote: JUMMAH,
    services: ["stitching", "alterations", "styling", "collect"],
    image: {
      src: "/images/pages/store-karachi-dolmen.jpg",
      alt: "AURAQ Dolmen Mall Clifton boutique arch with a mannequin in a powder blue suit",
    },
  },
  {
    id: "islamabad-centaurus",
    name: "The Centaurus",
    city: "Islamabad",
    country: "Pakistan",
    description:
      "Calm, airy and appointment-friendly, with luxury pret, the Signature Collection and winter karandi and velvet as the season turns.",
    address: { lines: ["Unit 2-17, Second Floor, The Centaurus Mall", "Jinnah Avenue, F-8"], locality: "Islamabad", region: "Islamabad Capital Territory", postalCode: "44000", countryCode: "PK" },
    mapsQuery: "The Centaurus Mall, Jinnah Avenue, Islamabad",
    phone: "+92 51 2800 287",
    phoneHref: "tel:+92512800287",
    email: "centaurus@auraq.pk",
    hours: mallHours,
    hoursNote: JUMMAH,
    services: ["alterations", "styling", "collect"],
    image: {
      src: "/images/pages/store-islamabad-centaurus.jpg",
      alt: "AURAQ Centaurus boutique arch with a mannequin in a lavender luxury pret suit",
    },
  },
  {
    id: "dubai-mall",
    name: "The Dubai Mall",
    city: "Dubai",
    country: "United Arab Emirates",
    description:
      "Our first boutique outside Pakistan, carrying luxury pret, formals and the Signature Collection, with alterations turned around in 48 hours for visitors.",
    address: { lines: ["Unit LG-142, Lower Ground Floor, The Dubai Mall", "Financial Centre Road, Downtown Dubai"], locality: "Dubai", region: "Dubai", countryCode: "AE" },
    mapsQuery: "The Dubai Mall, Financial Centre Road, Downtown Dubai",
    phone: "+971 4 339 0287",
    phoneHref: "tel:+97143390287",
    email: "dubai@auraq.pk",
    hours: [
      { label: "Monday – Thursday", days: MON_TO_THU, slots: [["10:00", "23:00"]] },
      { label: "Friday – Sunday", days: ["Friday", "Saturday", "Sunday"], slots: [["10:00", "24:00"]] },
    ],
    services: ["alterations", "styling", "taxfree"],
    image: {
      src: "/images/pages/store-dubai-mall.jpg",
      alt: "AURAQ Dubai Mall boutique arch with two mannequins in sand and ivory formals",
    },
  },
];

export const storesIntro = {
  eyebrow: "Visit Us",
  title: "Our Boutiques",
  text: "Five boutiques in four cities, each with in-store stylists, alterations and the full current season. Come and see the handwork up close.",
  image: { src: "/images/pages/stores-hero.jpg", alt: "Two models in ivory and rose embroidered suits beneath a softly lit arch" },
};

export const appointment = {
  eyebrow: "By Appointment",
  title: "Book a Styling Appointment",
  text: "Reserve a private hour with one of our stylists for wedding-season dressing, Eid wardrobes or simply finding your fit. Tell us your preferred boutique, date and occasion, and we’ll confirm within one working day.",
  virtualTitle: "Can’t visit in person?",
  virtualText: "Our stylists also host video consultations on WhatsApp, with fabric shown up close and pieces held to the camera, from Monday to Saturday.",
};

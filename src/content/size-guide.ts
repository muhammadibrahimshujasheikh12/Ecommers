/** Body measurements in inches. Adjust to the client's pattern blocks. */
export const sizeGuide = {
  columns: ["Size", "Bust", "Waist", "Hip", "Shirt length"],
  rows: [
    ["XS", "32", "26", "35", "40"],
    ["S", "34", "28", "37", "41"],
    ["M", "36", "30", "39", "42"],
    ["L", "39", "33", "42", "43"],
    ["XL", "42", "36", "45", "44"],
  ],
  note: "Measurements are body measurements. Our ready to wear has a relaxed straight fit with 2–3 inches of ease. If you are between sizes, choose the larger size.",
};

/** Approximate international equivalents, matched on bust measurement. */
export const internationalSizes = {
  columns: ["AURAQ", "UK", "US", "EU"],
  rows: [
    ["XS", "8", "4", "36"],
    ["S", "10", "6", "38"],
    ["M", "12", "8", "40"],
    ["L", "14", "10", "42"],
    ["XL", "16–18", "12–14", "44–46"],
  ],
};

/** Numbered to match the how-to-measure diagram on /size-guide. */
export const howToMeasure = [
  { label: "Bust", text: "Measure around the fullest part of your bust, keeping the tape level under your arms and across your shoulder blades." },
  { label: "Waist", text: "Measure around your natural waistline — the narrowest part of your torso, usually an inch above the navel." },
  { label: "Hip", text: "With your feet together, measure around the fullest part of your hips, roughly 8 inches below your waist." },
  { label: "Shirt length", text: "From the highest point of the shoulder, beside the neck, straight down to where you would like the hem to fall." },
  { label: "Trouser length", text: "From your natural waist down the outside of the leg to the ankle bone — wearing the shoes you plan to pair it with." },
];

export const measuringTips = [
  "Measure over light clothing or a well-fitting slip, never over a kurta.",
  "Keep the tape snug but not tight — one finger should slide beneath it.",
  "Stand relaxed and breathe normally; ask a friend to help with lengths.",
  "No tape to hand? Lay a kurta that fits you well flat, measure armpit to armpit and double it for your bust.",
];

export const fitNotes = [
  {
    kind: "kurta",
    title: "Kurtas & shirts",
    summary: "Relaxed straight fit, true to size",
    points: [
      "Cut with 2–3 inches of ease at the bust, so choose by your body measurement rather than a garment you own.",
      "Standard shirts fall at the knee (40–44 in., by size). Formal kalidars and pishwas are cut longer, at 50–54 in.; each product page lists the exact length.",
      "Full sleeves measure about 22 in. and finish with a deep hem, so any tailor can shorten them neatly.",
      "Co-ord shirts follow the same chart with a slightly boxier cut for easy layering.",
    ],
  },
  {
    kind: "trouser",
    title: "Trousers",
    summary: "Sits at the natural waist",
    points: [
      "Straight trousers and cigarette pants have a flat front with an elasticated back and drawstring.",
      "Standard length is 37–38 in., finished with a 1.5 in. hem that can be let down.",
      "Shararas, ghararas and palazzos are cut generously and comfortably span two sizes.",
      "Between sizes? The elasticated back flexes at the waist, so choose by your hip measurement.",
    ],
  },
  {
    kind: "dupatta",
    title: "Dupattas",
    summary: "One size, made to drape",
    points: [
      "Every dupatta measures 2.5 m × 1.1 m (98 × 43 in.), whether chiffon, organza, silk or lawn.",
      "Formal dupattas carry weighted, embellished borders that sit neatly over one shoulder.",
      "Pin organza at the shoulder or the back to keep its crisp shape through an evening.",
      "Store organza and tissue rolled rather than folded to keep them free of creases.",
    ],
  },
] as const;

/** Cut lengths in our unstitched suits (see each product's details for its exact contents). */
export const unstitchedGuide = {
  pieces: [
    { piece: "Embroidered shirt front", length: "1.25 m", note: "Neckline and border panels placed ready for cutting" },
    { piece: "Shirt back & sleeves", length: "1.75 m", note: "Enough for a shirt up to 44 in. long with full sleeves" },
    { piece: "Dupatta", length: "2.5 m", note: "Edges finished and ready to wear — 3 piece suits only" },
    { piece: "Dyed trouser", length: "2.5 m", note: "Suits a straight trouser or cigarette pant" },
  ],
  tips: [
    "Pre-wash cotton lawn in cold water before cutting and allow 2–3% for shrinkage. Dry clean silks, jacquards and organza instead.",
    "Give your tailor the measurements from our chart and ask for 1 in. seam allowances, so the shirt can be let out later.",
    "Position the embroidered neckline and borders before cutting the front; panels are sized to fit up to XL.",
    "A full shalwar or flared trouser needs about 3 m of fabric; our 2.5 m trouser length is cut for straight and cigarette styles.",
  ],
  exchangeNote: "Unstitched fabric can be exchanged within 7 days of delivery, provided it has not been cut.",
};

/** Atelier made-to-measure service (prices in PKR). */
export const customStitching = {
  stitchingFrom: 3500,
  turnaround: "10–14",
  text: "Can’t find your fit, or want your unstitched suit ready to wear? Our atelier on MM Alam Road tailors selected ready-to-wear and luxury pret pieces to your measurements, and stitches any AURAQ unstitched suit with the finish of our own ready to wear.",
  note: "Made-to-measure pieces are cut for you alone, so they are final sale and can’t be exchanged.",
};

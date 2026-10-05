// Renders the art-directed placeholder photography into public/images using
// the design prototype's art system (design/prototype/js/media.js).
// Replace with real campaign/product photography before launch — upload
// product shots to the Supabase "product-images" bucket and update URLs.
//
//   npm run images:generate              # renders only images that are missing
//   npm run images:generate -- --force   # re-renders everything
//
// (Set PLAYWRIGHT_CHROMIUM to a Chromium binary if one is not bundled.)

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { categories, collections, products } from "./catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = (p) => path.join(root, "public/images", p);
const mediaJs = readFileSync(path.join(root, "design/prototype/js/media.js"), "utf8");
const force = process.argv.includes("--force");

const mix = (hex, amt) => {
  const n = parseInt(hex.slice(1, 7), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt > 0 ? 255 : 0, p = Math.abs(amt);
  r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/** @type {{ file: string, w: number, h: number, art: object, opts?: object }[]} */
const jobs = [];
const job = (file, w, h, art, opts = {}) => jobs.push({ file, w, h, art, opts });

// Products: front + detail
for (const p of products) {
  const a = p.art;
  if (a.flatlay) {
    job(`products/${p.slug}-1.jpg`, 900, 1200, { kind: "flatlay", bg: a.bg, fabrics: a.fabrics });
    job(`products/${p.slug}-2.jpg`, 900, 1200, { kind: "figure", bg: a.bg, garment: a.fabrics[0], trouser: a.fabrics[1], accent: "#C8A86A", skin: a.skin });
  } else {
    // trouser / dupatta / skin are optional overrides; media.js supplies the defaults.
    const fig = {
      kind: "figure", bg: a.bg, garment: a.garment, trouser: a.trouser ?? (a.short ? a.garment : mix(a.garment, 0.35)),
      accent: a.accent, long: a.long, short: a.short, dupatta: a.dupatta, skin: a.skin,
    };
    job(`products/${p.slug}-1.jpg`, 900, 1200, fig);
    job(`products/${p.slug}-2.jpg`, 900, 1200, p.unstitched
      ? { kind: "flatlay", bg: a.bg, fabrics: [a.garment, mix(a.garment, 0.3), a.accent] }
      : { ...fig, alt: true });
  }
}

// Categories (2:3)
const catArt = {
  "ready-to-wear": { kind: "figure", bg: "#F3E3DD", garment: "#D3A79C", trouser: "#F4ECE4", accent: "#F7EDE6" },
  "3-piece": { kind: "figure", bg: "#F5EFE6", garment: "#DDB6AC", trouser: "#F3E8E1", accent: "#C8A86A" },
  "2-piece": { kind: "figure", bg: "#DFE4D5", garment: "#BFD8D2", trouser: "#F4F1E8", accent: "#F4F1E8" },
  shirts: { kind: "figure", bg: "#DDE5EB", garment: "#AFC0CD", trouser: "#F4F1EA", accent: "#F4F1EA" },
  "co-ords": { kind: "figure", bg: "#DFE4D5", garment: "#9FAE93", trouser: "#9FAE93", accent: "#EEF0E6", short: true },
  unstitched: { kind: "flatlay", bg: "#E9DDCB", fabrics: ["#C7B08F", "#A9B59C", "#E8C8BD"] },
  "unstitched-3-piece": { kind: "flatlay", bg: "#F3E3DD", fabrics: ["#E9C4AE", "#EFE3CF", "#A7B39A"] },
  "unstitched-2-piece": { kind: "flatlay", bg: "#DDE5EB", fabrics: ["#B9CBD6", "#E8DCC4"] },
  "luxury-pret": { kind: "figure", bg: "#E6E1EC", garment: "#B4A8C5", trouser: "#EEEAF2", accent: "#F3EFE4" },
  formals: { kind: "figure", bg: "#E4DED5", garment: "#7E6470", trouser: "#E4D8C8", accent: "#D9BE8E", long: true },
};
for (const c of categories) job(`categories/${c.slug}.jpg`, 800, 1200, catArt[c.slug]);

// Collections (4:5 portrait scenes)
const colArt = {
  latest: { kind: "scene", bg: "#E3D3CB", arch: "#EDE1DA", floor: "#D8C5BB", garments: ["#E8DCC4", "#C99A90"], figures: 2, portrait: true },
  festive: { kind: "scene", bg: "#D5BFB4", arch: "#E3D1C7", floor: "#C9B1A5", garments: ["#F4E8DA", "#B78C83"], figures: 2, portrait: true },
  luxury: { kind: "scene", bg: "#CBD5DC", arch: "#D9E1E7", floor: "#BFCAD1", garments: ["#A9BACB", "#F2EEE6"], figures: 2, portrait: true },
  seasonal: { kind: "scene", bg: "#D6DCCB", arch: "#E2E7D8", floor: "#CAD1BE", garments: ["#9FAE93", "#EAD9C8"], figures: 2, portrait: true },
  signature: { kind: "scene", bg: "#C9C1D3", arch: "#D6CFDF", floor: "#BEB5C9", garments: ["#B8AEC8"], figures: 1, portrait: true },
};
for (const c of collections) job(`collections/${c.slug}.jpg`, 1000, 1250, colArt[c.slug]);

// Campaigns
const heroes = {
  festive: { kind: "scene", bg: "#7A625B", arch: "#8C7269", floor: "#6B544E", garments: ["#EFDCCB", "#D7B0A6"], figures: 2, tone: "dark" },
  luxury: { kind: "scene", bg: "#5E6B74", arch: "#6F7C85", floor: "#515D66", garments: ["#DDE5EB", "#F4EFE6"], figures: 2, tone: "dark" },
  lawn: { kind: "scene", bg: "#6F7563", arch: "#808671", floor: "#61665A", garments: ["#E4E8D9", "#E9C9BE"], figures: 1, tone: "dark" },
};
for (const [k, art] of Object.entries(heroes)) {
  job(`campaigns/hero-${k}.jpg`, 2400, 1350, art, { align: "right" });
  job(`campaigns/hero-${k}-mobile.jpg`, 1080, 1620, art, { portrait: true, compact: true });
}
job("campaigns/story-festive.jpg", 1200, 1500, colArt.festive);
job("campaigns/story-luxury.jpg", 1400, 1100, { ...colArt.luxury, portrait: false });
job("campaigns/story-lawn.jpg", 1400, 1100, { ...colArt.seasonal, portrait: false });
const editorial = { kind: "scene", bg: "#56604F", arch: "#646F5C", floor: "#4C5546", garments: ["#ECE0CD", "#D8B4AB"], figures: 2, tone: "dark" };
job("campaigns/editorial.jpg", 2400, 1300, editorial, { align: "right" });
job("campaigns/editorial-mobile.jpg", 1080, 1620, editorial, { portrait: true, compact: true });
job("campaigns/look.jpg", 1200, 1500, { kind: "scene", bg: "#E4D6CB", arch: "#EDE2D9", floor: "#D9C9BC", garments: ["#E7D3C7"], figures: 1, portrait: true });
job("campaigns/spotlight.jpg", 1200, 1500, { kind: "scene", bg: "#D9C3B8", arch: "#E6D5CC", floor: "#CDB5A9", garments: ["#EAD7C3"], figures: 1, portrait: true });
job("campaigns/mega-festive.jpg", 800, 1000, colArt.festive);
job("campaigns/mega-luxury.jpg", 800, 1000, { kind: "figure", bg: "#DDE5EB", garment: "#AFC0CD", trouser: "#E9EEF1", accent: "#F4F1EA" });
const reels = [
  { bg: "#B9C6CF", arch: "#C8D3DA", floor: "#AFBCC5", garments: ["#9FB3C3"] },
  { bg: "#D9BDB4", arch: "#E4CCC4", floor: "#CFB1A7", garments: ["#F1E2D8"] },
  { bg: "#C9C1D3", arch: "#D6CFDF", floor: "#BEB5C9", garments: ["#B8AEC8"] },
  { bg: "#D8CBB6", arch: "#E3D8C6", floor: "#CDBFA8", garments: ["#CDB79A"] },
];
reels.forEach((r, i) => job(`campaigns/reel-${i + 1}.jpg`, 720, 1280, { kind: "scene", figures: 1, portrait: true, ...r }));

// Gallery
const galleryArt = [
  { kind: "scene", bg: "#E3D3CB", arch: "#EDE1DA", floor: "#D8C5BB", garments: ["#DDB6AC"], figures: 1, portrait: true },
  { kind: "figure", bg: "#DDE5EB", garment: "#EADBC6", trouser: "#EADBC6", accent: "#C8A86A", alt: true },
  { kind: "scene", bg: "#D6DCCB", arch: "#E2E7D8", floor: "#CAD1BE", garments: ["#9FAE93", "#EAD9C8"], figures: 2 },
  { kind: "figure", bg: "#E6E1EC", garment: "#B8AEC8", trouser: "#F0EDF3", accent: "#F3EEE2" },
  { kind: "flatlay", bg: "#F3E3DD", fabrics: ["#E8DCC4", "#D3A79C", "#AFC0CD"] },
  { kind: "figure", bg: "#EFE6D8", garment: "#7E6470", trouser: "#E6D9C6", accent: "#D9BE8E", long: true },
];
galleryArt.forEach((art, i) => job(`gallery/edit-${i + 1}.jpg`, 900, 1200, art));

job("og-default.jpg", 1200, 630, heroes.festive, { align: "right" });

// Brand pages: About, Store Locator, Journal (public/images/pages)
const aboutHero = { kind: "scene", bg: "#6F5E54", arch: "#806D62", floor: "#625249", garments: ["#F1E5D4", "#CDB0A6"], figures: 2, tone: "dark" };
job("pages/about-hero.jpg", 2400, 1350, aboutHero, { align: "right" });
job("pages/about-hero-mobile.jpg", 1080, 1620, aboutHero, { portrait: true, compact: true });
const aboutCta = { kind: "scene", bg: "#5A4C57", arch: "#6A5B67", floor: "#4F424C", garments: ["#E9DCCB", "#B8AEC8"], figures: 2, tone: "dark" };
job("pages/about-cta.jpg", 2400, 1300, aboutCta, { align: "right" });
job("pages/about-cta-mobile.jpg", 1080, 1620, aboutCta, { portrait: true, compact: true });
job("pages/founder.jpg", 1200, 1500, { kind: "figure", bg: "#EFE6D8", garment: "#F1E7DA", trouser: "#F1E7DA", accent: "#C8A86A", skin: "#B88A6C", alt: true });
job("pages/atelier.jpg", 1200, 1500, { kind: "flatlay", bg: "#E9DDCB", fabrics: ["#6E2F3A", "#EFE3CF", "#2F5A4C"] });
const craftArt = {
  zardozi: { kind: "figure", bg: "#E4DED5", garment: "#6E2F3A", trouser: "#E4D8C8", accent: "#C8A86A", long: true, alt: true },
  tilla: { kind: "figure", bg: "#E6E1EC", garment: "#9C8DB8", trouser: "#EEEAF2", accent: "#D9BE8E", alt: true },
  gota: { kind: "figure", bg: "#F5EFE6", garment: "#EFE3CF", trouser: "#F4ECE4", accent: "#C8A86A", alt: true },
  resham: { kind: "flatlay", bg: "#F3E3DD", fabrics: ["#D3A79C", "#A9B59C", "#E8DCC4"] },
  mukesh: { kind: "figure", bg: "#DDE5EB", garment: "#3E4558", trouser: "#C9D2DA", accent: "#D8D8D2", alt: true },
};
for (const [k, art] of Object.entries(craftArt)) job(`pages/craft-${k}.jpg`, 900, 1125, art);
const storeArt = {
  "lahore-flagship": { bg: "#D9C3B8", arch: "#E6D5CC", floor: "#CDB5A9", garments: ["#EAD7C3", "#C99A90"], figures: 2 },
  "lahore-emporium": { bg: "#D6DCCB", arch: "#E2E7D8", floor: "#CAD1BE", garments: ["#9FAE93"] },
  "karachi-dolmen": { bg: "#CBD5DC", arch: "#D9E1E7", floor: "#BFCAD1", garments: ["#A9BACB"] },
  "islamabad-centaurus": { bg: "#C9C1D3", arch: "#D6CFDF", floor: "#BEB5C9", garments: ["#B8AEC8"] },
  "dubai-mall": { bg: "#D8CBB6", arch: "#E3D8C6", floor: "#CDBFA8", garments: ["#CDB79A", "#F2EEE6"], figures: 2 },
};
for (const [k, art] of Object.entries(storeArt)) job(`pages/store-${k}.jpg`, 1400, 1050, { kind: "scene", figures: 1, ...art });
job("pages/stores-hero.jpg", 1200, 1500, { kind: "scene", bg: "#E3D3CB", arch: "#EDE1DA", floor: "#D8C5BB", garments: ["#F1E2D8", "#B78C83"], figures: 2, portrait: true });
const journalArt = {
  "festive-dupatta": { kind: "scene", bg: "#E8CFC6", arch: "#F0DDD6", floor: "#DCC1B7", garments: ["#F4E8DA"], figures: 1, portrait: true },
  "lawn-care": { kind: "flatlay", bg: "#DFE4D5", fabrics: ["#BFD8D2", "#F2D7CF", "#E9DFB8"] },
  zardozi: { kind: "figure", bg: "#4A3F3B", garment: "#2F5A4C", trouser: "#E4D8C8", accent: "#C8A86A", long: true, alt: true },
  "eid-edit": { kind: "scene", bg: "#CDB9A6", arch: "#DCCBBB", floor: "#C1AC98", garments: ["#F2E6D3", "#AFC0CD"], figures: 2, portrait: true },
  "fabric-guide": { kind: "flatlay", bg: "#EFE6D8", fabrics: ["#C7B08F", "#AFC0CD", "#7E6470"] },
};
for (const [k, art] of Object.entries(journalArt)) job(`pages/journal-${k}.jpg`, 1200, 1500, art);

// ---------------------------------------------------------------------------
// Existing files are kept byte-for-byte unless --force is passed.
const pending = force ? jobs : jobs.filter((j) => !existsSync(out(j.file)));
const iconFiles = [path.join(root, "src/app/icon.png"), path.join(root, "public/images/logo-mark.png")];
const renderIcon = force || iconFiles.some((f) => !existsSync(f));
if (!pending.length && !renderIcon) {
  console.log(`All ${jobs.length} images already exist (use --force to re-render)`);
  process.exit(0);
}

const { chromium } = await import("@playwright/test");
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {});
const page = await browser.newPage();
await page.setContent(`<html><body style="margin:0"><script>${mediaJs}</script><div id="s"></div></body></html>`);

for (const j of pending) {
  mkdirSync(path.dirname(out(j.file)), { recursive: true });
  await page.setViewportSize({ width: j.w, height: j.h });
  await page.evaluate(({ art, opts, w, h }) => {
    const el = document.getElementById("s");
    el.style.cssText = `width:${w}px;height:${h}px;position:relative;overflow:hidden`;
    el.innerHTML = window.AURAQ.art(art, opts);
    const svg = el.querySelector("svg");
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
  }, j);
  await page.locator("#s").screenshot({ path: out(j.file), type: "jpeg", quality: 82 });
}

// Brand icon (monogram)
if (renderIcon) {
  const fontPath = path.join(root, "src/app/fonts/cormorant-garamond-latin-wght-normal.woff2");
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`<html><head><style>@font-face{font-family:B;src:url(data:font/woff2;base64,${readFileSync(fontPath).toString("base64")})}body{margin:0}</style></head><body><div id="i" style="width:512px;height:512px;background:#2A2826;color:#FBF8F3;display:grid;place-items:center;font:500 360px/1 B"><span style="margin-top:-30px">A</span></div></body></html>`);
  await page.waitForTimeout(300);
  for (const file of iconFiles) await page.locator("#i").screenshot({ path: file });
}

await browser.close();
console.log(`Rendered ${pending.length} of ${jobs.length} images${renderIcon ? " + icon" : ""} (${jobs.length - pending.length} already existed)`);

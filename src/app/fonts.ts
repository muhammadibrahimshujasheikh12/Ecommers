import localFont from "next/font/local";

/*
 * Self-hosted, OFL-licensed fonts (no build-time network access needed).
 *
 * Display: the brand typeface is Bryn Vogue (commercial). Until its licensed
 * webfont is added, Bodoni Moda renders as the fallback inside the
 * --font-display stack ("Bryn Vogue", Bodoni Moda, Didot, serif).
 * To enable Bryn Vogue: add BrynVogue-Regular.woff2 to this folder and
 * replace the `display` definition below with
 *   localFont({ src: "./fonts/BrynVogue-Regular.woff2", variable: "--font-bodoni", display: "swap" })
 */
export const display = localFont({
  src: [
    { path: "./fonts/bodoni-moda-latin-standard-normal.woff2", style: "normal" },
    { path: "./fonts/bodoni-moda-latin-standard-italic.woff2", style: "italic" },
  ],
  weight: "400 900",
  variable: "--font-bodoni",
  display: "swap",
  fallback: ["Didot", "Georgia", "serif"],
});

/** Geometric sans for navigation, buttons, prices and labels. */
export const ui = localFont({
  src: "./fonts/jost-latin-wght-normal.woff2",
  weight: "300 700",
  variable: "--font-jost",
  display: "swap",
  fallback: ["Futura", "Century Gothic", "sans-serif"],
});

/** Body copy, descriptions, reviews, forms. */
export const body = localFont({
  src: [
    { path: "./fonts/open-sans-latin-wght-normal.woff2", style: "normal" },
    { path: "./fonts/open-sans-latin-wght-italic.woff2", style: "italic" },
  ],
  weight: "300 800",
  variable: "--font-open-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

import localFont from "next/font/local";

/*
 * Self-hosted, OFL-licensed variable fonts (no build-time network access needed).
 *
 * Display: Cormorant Garamond — high-contrast, calligraphic serif for headings.
 * Sans: Montserrat — navigation, buttons, prices, labels and body copy.
 * To swap a face, replace the .woff2 files in ./fonts and the definitions
 * below; the CSS variables (--font-cormorant, --font-montserrat) feed the
 * --font-display / --font-ui / --font-body tokens in globals.css.
 */
export const display = localFont({
  src: [
    { path: "./fonts/cormorant-garamond-latin-wght-normal.woff2", style: "normal" },
    { path: "./fonts/cormorant-garamond-latin-wght-italic.woff2", style: "italic" },
  ],
  weight: "300 700",
  variable: "--font-cormorant",
  display: "swap",
  fallback: ["Garamond", "Georgia", "serif"],
});

export const sans = localFont({
  src: [
    { path: "./fonts/montserrat-latin-wght-normal.woff2", style: "normal" },
    { path: "./fonts/montserrat-latin-wght-italic.woff2", style: "italic" },
  ],
  weight: "100 900",
  variable: "--font-montserrat",
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

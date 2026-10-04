/**
 * Demo mode runs the storefront on the bundled sample catalogue
 * (src/lib/demo/dataset.json) with no Supabase project. It switches on
 * automatically when NEXT_PUBLIC_SUPABASE_URL is not set (or still the
 * .env.example placeholder), or explicitly with
 * NEXT_PUBLIC_DEMO_MODE=true. Visitor state (bag, demo account, addresses,
 * demo orders, reviews) lives in that visitor's own cookies.
 */
export const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  // The untouched placeholder from .env.example
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

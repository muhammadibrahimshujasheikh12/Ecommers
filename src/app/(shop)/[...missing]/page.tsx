import { notFound } from "next/navigation";

/**
 * Sends URLs no other route handles to the storefront 404 ((shop)/not-found.tsx, with the header,
 * footer and suggestions) instead of the bare root one. Static and dynamic routes, API routes and
 * metadata files (robots.txt, sitemap.xml, icon) all outrank a catch-all, so nothing real lands here.
 */
export default function MissingPage() {
  notFound();
}

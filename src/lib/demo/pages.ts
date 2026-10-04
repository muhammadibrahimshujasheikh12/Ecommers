import "server-only";
import type { ContentPage } from "@/lib/data/pages";
import { demoData } from "./db";

/** Policy & information page from the bundled dataset (every demo page is published). */
export function demoPage(slug: string): ContentPage | null {
  const page = demoData.pages.find((p) => p.slug === slug);
  if (!page) return null;
  return { slug: page.slug, title: page.title, summary: page.summary, content: page.content, updatedAt: page.updated_at };
}

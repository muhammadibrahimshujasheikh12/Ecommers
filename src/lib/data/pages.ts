import "server-only";
import { cache } from "react";
import { CONTENT_TAG, createSupabasePublicClient } from "@/lib/supabase/public";

export type ContentPage = {
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  updatedAt: string;
};

/** Editable long-form page (policies, FAQs) from the `pages` table. */
export const getPage = cache(async (slug: string): Promise<ContentPage | null> => {
  const supabase = createSupabasePublicClient({ revalidate: 3600, tags: [CONTENT_TAG] });
  const { data, error } = await supabase
    .from("pages")
    .select("slug, title, summary, content, updated_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(`Could not load page: ${error.message}`);
  if (!data) return null;
  return { slug: data.slug, title: data.title, summary: data.summary, content: data.content, updatedAt: data.updated_at };
});

import { z } from "zod";
import { DEMO_MODE } from "@/lib/demo/mode";

/**
 * Public (browser-safe) configuration. NEXT_PUBLIC_* values are inlined at
 * build time, so they must be referenced literally below.
 *
 * Supabase settings are optional: without them the store runs in demo mode
 * on the bundled sample catalogue (see src/lib/demo/mode.ts).
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ message: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL" }).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_REVIEW_IMAGES_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

export const env = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_REVIEW_IMAGES_ENABLED: process.env.NEXT_PUBLIC_REVIEW_IMAGES_ENABLED || undefined,
});

export const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

/** Review photo uploads need Supabase Storage, so they are off in demo mode. */
export const reviewImagesEnabled = env.NEXT_PUBLIC_REVIEW_IMAGES_ENABLED && !DEMO_MODE;

/**
 * Supabase connection settings. Throws in demo mode so that any code path
 * that still reaches for Supabase fails loudly instead of hanging on DNS.
 */
export function supabaseConfig(): { url: string; anonKey: string } {
  if (DEMO_MODE || !env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured: the store is running in demo mode. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to connect a project.",
    );
  }
  return { url: env.NEXT_PUBLIC_SUPABASE_URL, anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY };
}

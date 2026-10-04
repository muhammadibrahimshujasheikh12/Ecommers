import { z } from "zod";

/**
 * Public (browser-safe) configuration. NEXT_PUBLIC_* values are inlined at
 * build time, so they must be referenced literally below.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ message: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL" }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_REVIEW_IMAGES_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

export const env = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_REVIEW_IMAGES_ENABLED: process.env.NEXT_PUBLIC_REVIEW_IMAGES_ENABLED || undefined,
});

export const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

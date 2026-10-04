import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { CATALOG_TAG, CONTENT_TAG } from "@/lib/supabase/public";

/**
 * On-demand cache refresh after editing products or pages in Supabase.
 * Call from a Supabase Database Webhook:
 *   POST /api/revalidate  { "tag": "catalog" | "content" }
 *   Header: Authorization: Bearer <REVALIDATE_SECRET>
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || provided.length !== secret.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { tag?: string };
  const tags = body.tag === "content" ? [CONTENT_TAG] : body.tag === "catalog" ? [CATALOG_TAG] : [CATALOG_TAG, CONTENT_TAG];
  for (const tag of tags) revalidateTag(tag, "max");
  return NextResponse.json({ revalidated: tags });
}

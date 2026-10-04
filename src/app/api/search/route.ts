import { NextResponse, type NextRequest } from "next/server";
import { searchSuggestions } from "@/lib/data/catalog";

/** Instant search suggestions for the search overlay. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ products: [], categories: [], collections: [] });
  try {
    const data = await searchSuggestions(q);
    return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("search failed", error);
    return NextResponse.json({ error: "Search unavailable" }, { status: 503 });
  }
}

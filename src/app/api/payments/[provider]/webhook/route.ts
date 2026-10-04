import { NextResponse, type NextRequest } from "next/server";
import { getPaymentProvider } from "@/lib/payments/registry";

/**
 * Generic payment webhook entry point: /api/payments/<provider>/webhook.
 * Each gateway implementation verifies its own signature in handleWebhook().
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/payments/[provider]/webhook">) {
  const { provider: code } = await ctx.params;
  const provider = getPaymentProvider(code);
  if (!provider?.handleWebhook) return NextResponse.json({ error: "Unknown payment provider" }, { status: 404 });
  return provider.handleWebhook(request);
}

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DEMO_MODE } from "@/lib/demo/mode";
import { demoGetCoupon } from "@/lib/demo/account";
import { formatPrice } from "@/utils/format";
import { cn } from "@/utils/cn";

/** The coupon offered to new customers on the account overview. */
const WELCOME_CODE = "WELCOME10";

type CouponTerms = { code: string; type: "percentage" | "fixed"; value: number; minimum_order: number; maximum_discount: number | null };

/** The welcome coupon's terms while it can be redeemed; null if it is missing, inactive, outside its dates or used up. */
async function getWelcomeCoupon(): Promise<CouponTerms | null> {
  if (DEMO_MODE) return demoGetCoupon(WELCOME_CODE);
  try {
    // Coupons are readable by admins only (RLS); only the public terms are selected.
    const { data } = await createSupabaseAdminClient()
      .from("coupons")
      .select("code, type, value, minimum_order, maximum_discount, starts_at, expires_at, usage_limit, times_used")
      .eq("code", WELCOME_CODE)
      .eq("active", true)
      .maybeSingle();
    if (!data) return null;
    const now = Date.now();
    if (data.starts_at && Date.parse(data.starts_at) > now) return null;
    if (data.expires_at && Date.parse(data.expires_at) <= now) return null;
    if (data.usage_limit !== null && data.times_used >= data.usage_limit) return null;
    return data;
  } catch (e) {
    console.error("Welcome coupon look-up failed", e);
    return null;
  }
}

/**
 * "A welcome gift: 10% off your first order over Rs. 5,000 with code WELCOME10
 * (up to Rs. 3,000 off)", worded from the coupon itself so the panel never
 * promises more than checkout gives. Renders nothing if the code can't be used.
 */
export async function WelcomeGift({ className }: { className?: string }) {
  const coupon = await getWelcomeCoupon();
  if (!coupon) return null;
  const value = Number(coupon.value);
  const minimum = Number(coupon.minimum_order);
  const cap = coupon.type === "percentage" && coupon.maximum_discount !== null ? Number(coupon.maximum_discount) : null;
  return (
    <p className={cn("max-w-md border-l-2 border-charcoal pl-4 font-ui text-[13px] leading-relaxed tracking-[0.02em]", className)}>
      A welcome gift: {coupon.type === "percentage" ? `${value}%` : formatPrice(value)} off your first order{minimum > 0 ? ` over ${formatPrice(minimum)}` : ""} with code{" "}
      <strong className="font-semibold tracking-[0.08em]">{coupon.code.toUpperCase()}</strong>
      {cap !== null ? ` (up to ${formatPrice(cap)} off)` : ""}.
    </p>
  );
}

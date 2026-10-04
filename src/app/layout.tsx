import type { Metadata, Viewport } from "next";
import "./globals.css";
import { body, display, ui } from "./fonts";
import { siteUrl } from "@/lib/env";
import { site } from "@/content/site";
import { getCurrentUser } from "@/lib/supabase/server";
import { getCartCount } from "@/lib/data/cart";
import { getWishlistIds } from "@/lib/data/wishlist";
import { getProfile } from "@/lib/data/account";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui/content";
import { ToastProvider } from "@/components/providers/toast-provider";
import { CartProvider } from "@/features/cart/cart-provider";
import { WishlistProvider } from "@/features/wishlist/wishlist-provider";
import { SessionContextProvider } from "@/components/providers/session-provider";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${site.name} — Luxury Pret, Formals & Unstitched`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: ["Pakistani clothing", "luxury pret", "formal wear", "unstitched lawn", "ready to wear", "Pakistani designer", "eid collection"],
  openGraph: { siteName: site.name, locale: site.locale, type: "website" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const [cartCount, wishlistIds, profile] = await Promise.all([
    getCartCount().catch(() => 0),
    user ? getWishlistIds() : Promise.resolve([] as string[]),
    user ? getProfile(user.id, user.email ?? "") : Promise.resolve(null),
  ]);

  return (
    <html lang="en-PK" className={`${display.variable} ${ui.variable} ${body.variable}`}>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only z-[200] bg-charcoal px-4 py-3 text-ivory focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
          Skip to content
        </a>
        <ToastProvider>
          <SessionContextProvider value={{ isAuthenticated: Boolean(user), firstName: profile?.firstName ?? null, email: user?.email ?? null }}>
            <CartProvider initialCount={cartCount}>
              <WishlistProvider isAuthenticated={Boolean(user)} initialIds={wishlistIds}>
                {children}
              </WishlistProvider>
            </CartProvider>
          </SessionContextProvider>
        </ToastProvider>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      </body>
    </html>
  );
}

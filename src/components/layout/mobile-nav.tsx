"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, MessageCircle, Plus, Truck, UserRound } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { mainNav } from "@/content/navigation";
import { site } from "@/content/site";
import { cn } from "@/utils/cn";

export function MobileNav({ open, onClose, isAuthenticated }: { open: boolean; onClose: () => void; isAuthenticated: boolean }) {
  const feature = mainNav.find((n) => n.mega)?.mega?.features[0];
  return (
    <Drawer open={open} onClose={onClose} side="left" title="Menu">
      <nav aria-label="Mobile" className="px-6 pb-10 pt-2">
        <ul>
          {mainNav.map((item) =>
            item.mega ? (
              <li key={item.label} className="border-b border-line">
                <details className="group">
                  <summary className="flex min-h-[58px] items-center justify-between font-ui text-[14px] font-medium uppercase tracking-[0.14em]">
                    {item.label}
                    <Plus className="size-4 transition-transform duration-300 group-open:rotate-45" strokeWidth={1.4} aria-hidden />
                  </summary>
                  <div className="space-y-5 pb-6">
                    <Link href={item.href} onClick={onClose} className="block font-ui text-[15px] font-medium underline underline-offset-4">
                      Shop all {item.label}
                    </Link>
                    {item.mega.columns.slice(0, 2).map((col) => (
                      <div key={col.title}>
                        <p className="mb-3 font-ui text-[11px] font-medium uppercase tracking-[0.2em] text-ink-3">{col.title}</p>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
                          {col.links.map((l) => (
                            <li key={l.href + l.label}>
                              <Link href={l.href} onClick={onClose} className="font-ui text-[15px] text-ink-2">
                                {l.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </details>
              </li>
            ) : (
              <li key={item.label} className="border-b border-line">
                <Link href={item.href} onClick={onClose} className={cn("flex min-h-[58px] items-center font-ui text-[14px] font-medium uppercase tracking-[0.14em]", item.highlight && "text-sale")}>
                  {item.label}
                </Link>
              </li>
            ),
          )}
        </ul>

        {feature && (
          <Link href={feature.href} onClick={onClose} className="my-8 grid grid-cols-[112px_1fr] items-center gap-4 bg-cream">
            <div className="relative aspect-[4/5]">
              <Image src={feature.image} alt={feature.alt} fill sizes="112px" className="object-cover" />
            </div>
            <div className="pr-3">
              <p className="eyebrow mb-1.5">{feature.subtitle}</p>
              <p className="font-display text-[24px] leading-tight">{feature.title}</p>
            </div>
          </Link>
        )}

        <ul className="space-y-1">
          {[
            { href: isAuthenticated ? "/account" : "/login", label: isAuthenticated ? "My Account" : "Sign In / Register", icon: UserRound },
            { href: "/wishlist", label: "Wishlist", icon: Heart },
            { href: "/track-order", label: "Track Order", icon: Truck },
            { href: "/stores", label: "Store Locator", icon: MapPin },
            { href: site.contact.whatsapp, label: "WhatsApp Customer Care", icon: MessageCircle },
          ].map(({ href, label, icon: Icon }) => (
            <li key={label}>
              <Link href={href} onClick={onClose} className="flex min-h-12 items-center gap-4 font-ui text-[15px]">
                <Icon className="size-5" strokeWidth={1.3} aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 font-ui text-[13px] tracking-[0.04em] text-ink-3">Pakistan · Prices in PKR</p>
      </nav>
    </Drawer>
  );
}

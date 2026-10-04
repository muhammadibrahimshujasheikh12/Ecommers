"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutGrid, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/utils/cn";

const LINKS = [
  { href: "/account", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile & Security", icon: UserRound },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account">
      <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
        {LINKS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 whitespace-nowrap rounded-full border px-4 font-ui text-[14px] lg:h-12 lg:rounded-none lg:border-0 lg:border-l-2 lg:px-5",
                  active ? "border-charcoal bg-charcoal text-ivory lg:bg-cream lg:text-charcoal" : "border-line-strong text-ink-2 hover:text-charcoal lg:border-transparent",
                )}
              >
                <Icon className="size-4" strokeWidth={1.4} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0">
          <form action={logoutAction}>
            <button type="submit" className="flex h-11 items-center gap-3 whitespace-nowrap rounded-full border border-line-strong px-4 font-ui text-[14px] text-ink-2 hover:text-charcoal lg:h-12 lg:w-full lg:rounded-none lg:border-0 lg:border-l-2 lg:border-transparent lg:px-5">
              <LogOut className="size-4" strokeWidth={1.4} aria-hidden />
              Sign out
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}

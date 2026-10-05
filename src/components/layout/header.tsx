"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { mainNav, type NavItem } from "@/content/navigation";
import { Logo } from "@/components/ui/content";
import { useCart } from "@/features/cart/cart-provider";
import { useWishlist } from "@/features/wishlist/wishlist-provider";
import { SearchOverlay } from "@/features/search/search-overlay";
import { MobileNav } from "./mobile-nav";
import { cn } from "@/utils/cn";

const iconBtn = "relative grid size-11 place-items-center text-charcoal transition-opacity hover:opacity-70";
const countBadge = "absolute right-0.5 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 font-ui text-[11px] font-medium leading-none";

export function Header({ isAuthenticated, firstName }: { isAuthenticated: boolean; firstName: string | null }) {
  const pathname = usePathname();
  const cart = useCart();
  const wishlist = useWishlist();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [lastPath, setLastPath] = useState(pathname);
  const closeTimer = useRef<number | undefined>(undefined);

  // Close menus on navigation.
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpenMenu(null);
    setMobileOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openMega = (label: string) => {
    window.clearTimeout(closeTimer.current);
    setOpenMenu(label);
  };
  const closeMega = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 140);
  };

  return (
    <>
      <header
        className={cn("sticky top-0 z-40 border-b border-line bg-ivory/[0.97] backdrop-blur-[2px] transition-shadow", scrolled && "shadow-[0_1px_2px_rgb(42_40_38/0.05)]")}
        onKeyDown={(e) => e.key === "Escape" && setOpenMenu(null)}
      >
        <div className={cn("container-site grid grid-cols-[1fr_auto_1fr] items-center transition-[height] duration-300", scrolled ? "h-[60px] lg:h-[68px]" : "h-[60px] lg:h-[84px]")}>
          <div className="flex items-center gap-1">
            <button type="button" className={cn(iconBtn, "-ml-2.5 lg:hidden")} onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="size-[22px]" strokeWidth={1.3} />
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="group flex h-11 items-center gap-3 px-2.5 text-charcoal lg:-ml-2.5"
              aria-label="Search products"
            >
              <Search className="size-[21px]" strokeWidth={1.3} />
              <span className="ui-label hidden text-[13px] tracking-[0.14em] lg:inline group-hover:opacity-70">Search</span>
            </button>
          </div>

          <Link href="/" aria-label="AURAQ — home" className="flex flex-col items-center">
            <Logo className={cn("text-center transition-transform duration-300", scrolled && "lg:scale-[0.86]")} />
          </Link>

          <div className="-mr-2.5 flex items-center justify-end">
            <Link href={isAuthenticated ? "/account" : "/login"} className={cn(iconBtn, "hidden sm:grid")} aria-label={isAuthenticated ? `Account${firstName ? ` — ${firstName}` : ""}` : "Sign in"}>
              <UserRound className="size-[21px]" strokeWidth={1.3} />
            </Link>
            <Link href="/wishlist" className={cn(iconBtn, "hidden sm:grid")} aria-label={`Wishlist${wishlist.ids.length ? `, ${wishlist.ids.length} items` : ""}`}>
              <Heart className="size-[21px]" strokeWidth={1.3} />
              {wishlist.ids.length > 0 && <span className={cn(countBadge, "bg-rose text-charcoal")}>{wishlist.ids.length}</span>}
            </Link>
            <button type="button" onClick={cart.open} className={iconBtn} aria-label={`Shopping bag, ${cart.count} items`}>
              <ShoppingBag className="size-[21px]" strokeWidth={1.3} />
              {cart.count > 0 && <span key={cart.count} className={cn(countBadge, "animate-fade-in bg-charcoal text-ivory")}>{cart.count}</span>}
            </button>
          </div>
        </div>

        {/* Desktop navigation */}
        <nav aria-label="Main" className="hidden lg:block" onMouseLeave={closeMega}>
          <ul className="container-site flex h-[50px] items-stretch justify-center gap-7 xl:gap-11">
            {mainNav.map((item) => (
              <NavEntry
                key={item.label}
                item={item}
                open={openMenu === item.label}
                // Query shortcuts (/shop?sort=…, /shop?sale=1) share one path, so they never mark the current section.
                active={item.href !== "/" && !item.href.includes("?") && pathname === item.href}
                onOpen={() => (item.mega ? openMega(item.label) : setOpenMenu(null))}
                onClose={closeMega}
              />
            ))}
          </ul>
        </nav>

        {/* Mobile: horizontally scrolling shortcuts (fastest path to a category) */}
        <nav aria-label="Shortcuts" className="border-t border-line lg:hidden">
          <ul className="scrollbar-none flex h-11 items-center gap-6 overflow-x-auto px-4">
            {mainNav.map((item) => (
              <li key={item.label} className="shrink-0">
                <Link href={item.href} className={cn("ui-label text-[12px] tracking-[0.14em]", item.highlight && "text-sale")}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} isAuthenticated={isAuthenticated} />
    </>
  );
}

function NavEntry({ item, open, active, onOpen, onClose }: { item: NavItem; open: boolean; active: boolean; onOpen: () => void; onClose: () => void }) {
  return (
    <li
      className="flex"
      onMouseEnter={onOpen}
      onFocus={onOpen}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onClose();
      }}
    >
      <Link
        href={item.href}
        aria-expanded={item.mega ? open : undefined}
        className={cn(
          "relative flex items-center font-ui text-[13px] font-medium uppercase tracking-[0.16em]",
          "after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-center after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:scale-x-100",
          (open || active) && "after:scale-x-100",
          item.highlight && "text-sale",
        )}
      >
        {item.label}
      </Link>
      {item.mega && (
        <div
          className={cn(
            "absolute inset-x-0 top-full border-t border-line bg-ivory shadow-[var(--shadow-overlay)] transition-[opacity,translate,visibility] duration-300",
            open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0",
          )}
        >
          <div className="container-site grid grid-cols-12 gap-6 pb-14 pt-12">
            {item.mega.columns.map((col) => (
              <div key={col.title} className="col-span-2">
                <p className="mb-5 font-ui text-[12px] font-medium uppercase tracking-[0.2em] text-ink-3">{col.title}</p>
                <ul className="space-y-3.5">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="font-ui text-[16px] tracking-[0.02em] transition-[padding,color] duration-300 hover:pl-1.5 hover:text-ink-2" tabIndex={open ? 0 : -1}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="col-span-6 col-start-7 grid grid-cols-2 gap-6">
              {item.mega.features.map((f) => (
                <Link key={f.title} href={f.href} className="group" tabIndex={open ? 0 : -1}>
                  <div className="relative aspect-[4/5] overflow-hidden bg-beige">
                    <Image src={f.image} alt={f.alt} fill sizes="(min-width: 1440px) 320px, 22vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  </div>
                  <p className="mt-4 font-display text-[22px] leading-tight">{f.title}</p>
                  <p className="eyebrow mt-1.5">{f.subtitle}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

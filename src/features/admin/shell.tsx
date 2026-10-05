"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Shirt,
  ShoppingBag,
  Star,
  TicketPercent,
  Truck,
  Users,
} from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/utils/cn";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Shirt },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
] as const;

type ShellAdmin = { name: string; email: string; demo: boolean };

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {NAV.map(({ href, label, icon: Icon, ...rest }) => {
        const active = "exact" in rest ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-[3px] px-3 font-ui text-[14px] transition-colors",
                active ? "bg-charcoal text-ivory" : "text-ink-2 hover:bg-cream hover:text-charcoal",
              )}
            >
              <Icon aria-hidden className="size-[18px]" strokeWidth={1.5} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="block">
      <span className="block font-display text-[24px] font-medium leading-none tracking-[0.28em]">AURAQ</span>
      <span className="mt-1.5 block font-ui text-[10px] uppercase tracking-[0.32em] text-ink-3">Admin</span>
    </Link>
  );
}

function AccountBox({ admin }: { admin: ShellAdmin }) {
  return (
    <div className="border-t border-line pt-5">
      <p className="truncate font-ui text-[13px] font-medium">{admin.name}</p>
      <p className="truncate text-[12px] text-ink-3">{admin.email}</p>
      <form action={logoutAction} className="mt-3">
        <button type="submit" className="inline-flex min-h-10 items-center gap-2 font-ui text-[13px] text-ink-2 hover:text-charcoal">
          <LogOut aria-hidden className="size-4" strokeWidth={1.5} />
          Sign out
        </button>
      </form>
    </div>
  );
}

export function AdminShell({ admin, children }: { admin: ShellAdmin; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-ivory lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-line bg-cream/60 lg:block">
        <div className="sticky top-0 flex h-dvh flex-col gap-8 overflow-y-auto px-5 py-7">
          <Brand />
          <nav aria-label="Admin" className="flex-1">
            <NavLinks />
          </nav>
          <AccountBox admin={admin} />
        </div>
      </aside>

      <div className="min-w-0">
        {admin.demo && (
          <p className="bg-blush px-5 py-2.5 text-center font-ui text-[12px] tracking-[0.02em] text-charcoal md:px-8">
            Demo admin — changes are kept in server memory, shared by every visitor and reset when the server restarts.
          </p>
        )}
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-ivory/95 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open admin menu"
              className="grid size-11 place-items-center rounded-[3px] hover:bg-cream"
            >
              <Menu aria-hidden className="size-5" strokeWidth={1.5} />
            </button>
            <Brand />
          </div>
          <p className="hidden font-ui text-[12px] uppercase tracking-[0.16em] text-ink-3 lg:block">Store management</p>
          <Link
            href="/"
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-10 items-center gap-2 font-ui text-[13px] text-ink-2 hover:text-charcoal"
          >
            View store
            <ExternalLink aria-hidden className="size-3.5" strokeWidth={1.5} />
            <span className="sr-only">(opens in a new tab)</span>
          </Link>
        </div>

        <main id="main" className="mx-auto w-full max-w-[1320px] px-5 py-8 md:px-8 md:py-10">
          {children}
        </main>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} side="left" title="Admin menu">
        <div className="flex h-full flex-col gap-8 px-5 pb-8">
          <nav aria-label="Admin">
            <NavLinks onNavigate={() => setOpen(false)} />
          </nav>
          <AccountBox admin={admin} />
        </div>
      </Drawer>
    </div>
  );
}

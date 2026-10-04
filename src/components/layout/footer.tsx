import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { footerNav } from "@/content/navigation";
import { site } from "@/content/site";
import { Logo, SocialIcon } from "@/components/ui/content";
import { NewsletterForm } from "@/features/marketing/newsletter-form";

const PAYMENTS = ["Visa", "Mastercard", "UnionPay", "JazzCash", "Easypaisa", "COD"];
const SOCIAL = [
  { name: "instagram", label: "Instagram", href: site.social.instagram },
  { name: "facebook", label: "Facebook", href: site.social.facebook },
  { name: "tiktok", label: "TikTok", href: site.social.tiktok },
  { name: "pinterest", label: "Pinterest", href: site.social.pinterest },
] as const;

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      {/* Desktop: always-open column */}
      <div className="hidden md:block">
        <p className="mb-6 font-ui text-[13px] font-medium uppercase tracking-[0.16em]">{title}</p>
        {children}
      </div>
      {/* Mobile: collapsed accordion (no JS) */}
      <details className="group border-b border-line-strong md:hidden">
        <summary className="flex min-h-14 cursor-pointer items-center justify-between font-ui text-[13px] font-medium uppercase tracking-[0.16em]">
          {title}
          <span aria-hidden className="text-[20px] font-light">
            <span className="group-open:hidden">+</span>
            <span className="hidden group-open:inline">–</span>
          </span>
        </summary>
        <div className="pb-5">{children}</div>
      </details>
    </>
  );
}

const linkCls = "font-ui text-[14px] tracking-[0.02em] text-ink-2 transition-colors hover:text-charcoal";

export function Footer() {
  return (
    <footer className="bg-beige pt-14 md:pt-20" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="container-site grid gap-10 pb-10 md:grid-cols-12 md:gap-6 md:pb-16">
        <div className="md:col-span-12 lg:col-span-3 lg:pr-6">
          <Logo className="[&>span:first-child]:text-[30px]" />
          <p className="mt-6 max-w-xs text-[14px] leading-relaxed text-ink-2">
            Contemporary Pakistani luxury — pret, formals and unstitched, crafted in our Lahore atelier.
          </p>
          <ul className="mt-6 space-y-2.5 font-ui text-[14px]">
            <li>
              <a href={site.contact.phoneHref} className="flex items-center gap-3 hover:text-ink-2">
                <Phone className="size-4" strokeWidth={1.3} aria-hidden /> {site.contact.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.contact.email}`} className="flex items-center gap-3 hover:text-ink-2">
                <Mail className="size-4" strokeWidth={1.3} aria-hidden /> {site.contact.email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.3} aria-hidden />
              <span>
                {site.contact.address.street}, {site.contact.address.city}
              </span>
            </li>
          </ul>
        </div>

        <nav aria-label="Footer" className="grid border-t border-line-strong md:col-span-8 md:grid-cols-4 md:gap-6 md:border-0 lg:col-span-6">
          <Column title="Shop">
            <ul className="space-y-3">
              {footerNav.shop.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkCls}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Column>
          <Column title="Customer Care">
            <ul className="space-y-3">
              {footerNav.care.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkCls}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Column>
          <Column title="Legal">
            <ul className="space-y-3">
              {footerNav.legal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkCls}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Column>
          <Column title="Follow">
            <ul className="space-y-3">
              {SOCIAL.map((s) => (
                <li key={s.name}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className={`${linkCls} inline-flex items-center gap-2.5`}>
                    <SocialIcon name={s.name} /> {s.label}
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </Column>
        </nav>

        <div className="md:col-span-4 lg:col-span-3">
          <p className="font-ui text-[13px] font-medium uppercase tracking-[0.16em]">Newsletter</p>
          <p className="mt-4 text-[14px] text-ink-2">New collections and private offers, first.</p>
          <NewsletterForm variant="footer" source="footer" />
        </div>
      </div>

      <div className="container-site flex flex-col gap-5 border-t border-line-strong py-7 md:flex-row md:items-center md:justify-between">
        <p className="font-ui text-[13px] tracking-[0.04em] text-ink-2">
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </p>
        <ul className="flex flex-wrap gap-2" aria-label="Accepted payment methods">
          {PAYMENTS.map((p) => (
            <li key={p} className="grid h-8 place-items-center rounded-[2px] border border-line-strong bg-ivory px-3 font-ui text-[11px] font-medium tracking-[0.08em] text-ink-2">
              {p}
            </li>
          ))}
        </ul>
        <Link href="/shipping-policy" className="font-ui text-[13px] tracking-[0.04em] text-ink-2 hover:text-charcoal">
          Pakistan · PKR Rs. — we ship worldwide
        </Link>
      </div>
    </footer>
  );
}

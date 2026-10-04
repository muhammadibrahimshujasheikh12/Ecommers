import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, type Crumb } from "@/components/ui/misc";
import { cn } from "@/utils/cn";

/** Editorial header for category & collection pages. */
export function ListingHero({
  crumbs,
  eyebrow,
  title,
  description,
  image,
  links,
  activeSlug,
  tone = "cream",
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: string;
  description: string | null;
  image: string | null;
  links?: { label: string; href: string; slug: string }[];
  activeSlug?: string;
  tone?: "cream" | "blush" | "sage";
}) {
  const bg = { cream: "bg-cream", blush: "bg-blush", sage: "bg-sage" }[tone];
  return (
    <section className={cn(bg, "mb-10 md:mb-14")}>
      <div className="container-site grid grid-cols-[minmax(0,1fr)] items-center gap-8 py-8 md:grid-cols-[minmax(0,1fr)_340px] md:py-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
        <div className="min-w-0">
          <Breadcrumbs items={crumbs} />
          <p className="eyebrow mt-8 md:mt-10">{eyebrow}</p>
          <h1 className="heading-page mt-3">{title}</h1>
          {description && <p className="mt-4 max-w-xl text-ink-2 md:text-[16px]">{description}</p>}
          {links && links.length > 0 && (
            <nav aria-label={`${title} categories`} className="scrollbar-none -mx-4 mt-8 overflow-x-auto px-4">
              <ul className="flex gap-2">
                {links.map((l) => (
                  <li key={l.href} className="shrink-0">
                    <Link
                      href={l.href}
                      aria-current={l.slug === activeSlug ? "page" : undefined}
                      className={cn(
                        "inline-flex h-10 items-center rounded-full border px-5 font-ui text-[13px] tracking-[0.04em] transition-colors",
                        l.slug === activeSlug ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/25 hover:border-charcoal",
                      )}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
        {image && (
          <div className="relative hidden aspect-[4/5] max-h-[440px] overflow-hidden md:block">
            <Image src={image} alt="" fill priority sizes="400px" className="object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}

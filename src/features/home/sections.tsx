import Image from "next/image";
import Link from "next/link";
import { getImageProps } from "next/image";
import { ArrowRight, Globe, Lock, MessageCircle, Repeat } from "lucide-react";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { SectionHeading, Stars } from "@/components/ui/misc";
import { SocialIcon } from "@/components/ui/content";
import { ProductGrid } from "@/components/product/product-card";
import { NewsletterForm } from "@/features/marketing/newsletter-form";
import { categoryTiles, collectionSpotlight, editorialBanner, featuredCollections, gallery } from "@/content/home";
import { site } from "@/content/site";
import type { ProductSummary, Review } from "@/types/domain";
import { formatDate } from "@/utils/format";

const arrow = <ArrowRight className="size-4" strokeWidth={1.4} aria-hidden />;

export function FeaturedCollections() {
  const { lead, secondary } = featuredCollections;
  return (
    <section aria-labelledby="collections-heading" className="container-site reveal py-16 md:py-24 xl:py-32">
      <SectionHeading id="collections-heading" eyebrow="Now Showing" title="The Collections" action={<Link href="/collections" className="link-underline ui-label inline-flex items-center gap-2 text-[12px]">All Collections {arrow}</Link>} />
      <div className="grid gap-7 md:grid-cols-[7fr_5fr] md:gap-5 lg:gap-6">
        <Link href={lead.href} className="group relative block">
          <div className="relative aspect-[4/5] overflow-hidden bg-beige">
            <Image src={lead.image} alt={lead.alt} fill sizes="(min-width: 768px) 58vw, 100vw" className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-standard)] group-hover:scale-[1.03]" />
          </div>
          <div className="bg-ivory pt-5 md:absolute md:bottom-0 md:left-0 md:w-[min(480px,78%)] md:pr-10 md:pt-10">
            <p className="eyebrow">{lead.eyebrow}</p>
            <h3 className="heading-page mt-3">{lead.title}</h3>
            <p className="mt-3 max-w-sm text-ink-2">{lead.text}</p>
            <span className={buttonClasses({ className: "mt-6 max-md:w-full" })}>Shop Now</span>
          </div>
        </Link>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:grid-rows-2 md:gap-5 lg:gap-6">
          {secondary.map((c) => (
            <Link key={c.href} href={c.href} className="group flex flex-col">
              <div className="relative aspect-[4/5] overflow-hidden bg-beige md:aspect-auto md:min-h-0 md:flex-1">
                <Image src={c.image} alt={c.alt} fill sizes="(min-width: 768px) 40vw, 50vw" className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-standard)] group-hover:scale-[1.03]" />
              </div>
              <div className="flex flex-col gap-2 pt-4 md:flex-row md:items-end md:justify-between md:gap-4 md:pt-5">
                <div>
                  <h3 className="font-display text-[22px] leading-tight md:text-[30px]">{c.title}</h3>
                  <p className="mt-1 text-[13px] text-ink-2 md:text-[15px]">{c.text}</p>
                </div>
                <span className="link-underline ui-label inline-flex shrink-0 items-center gap-2 self-start text-[11px] md:self-auto md:text-[12px]">
                  Shop Now {arrow}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ShopByCategory() {
  return (
    <section aria-labelledby="category-heading" className="reveal pb-16 md:pb-24 xl:pb-32">
      <div className="container-site">
        <SectionHeading id="category-heading" eyebrow="Find Your Fit" title="Shop by Category" />
      </div>
      <ul className="scrollbar-none container-site flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-4 md:grid md:grid-cols-3 md:gap-x-5 md:gap-y-10 md:overflow-visible lg:grid-cols-6 lg:gap-6">
        {categoryTiles.map((c) => (
          <li key={c.href} className="w-[42%] shrink-0 snap-start md:w-auto">
            <Link href={c.href} className="group block">
              <div className="relative aspect-[2/3] overflow-hidden bg-beige">
                <Image src={c.image} alt="" fill sizes="(min-width: 1024px) 16vw, (min-width: 768px) 31vw, 42vw" className="object-cover transition-transform duration-1000 ease-[var(--ease-standard)] group-hover:scale-[1.04]" />
              </div>
              <h3 className="mt-3 font-display text-[20px] leading-tight md:mt-4 md:text-[24px]">
                <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">{c.name}</span>
              </h3>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProductRail({
  id,
  eyebrow,
  title,
  href,
  linkLabel,
  products,
  centered,
  tone,
  showRating,
}: {
  id: string;
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
  products: ProductSummary[];
  centered?: boolean;
  tone?: "cream";
  showRating?: boolean;
}) {
  if (!products.length) return null;
  return (
    <section aria-labelledby={id} className={tone === "cream" ? "bg-cream py-16 md:py-24 xl:py-32" : "pb-16 md:pb-24 xl:pb-32"}>
      <div className="container-site reveal">
        <SectionHeading
          id={id}
          eyebrow={eyebrow}
          title={title}
          align={centered ? "center" : "left"}
          action={centered ? undefined : <Link href={href} className="link-underline ui-label hidden items-center gap-2 text-[12px] md:inline-flex">{linkLabel} {arrow}</Link>}
        />
        <ProductGrid products={products} showRating={showRating} />
        <div className={centered ? "mt-12 flex justify-center md:mt-14" : "mt-10 md:hidden"}>
          <ButtonLink href={href} variant="secondary" className="max-md:w-full">
            {linkLabel}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

function ArtBackground({ desktop, mobile, alt }: { desktop: string; mobile: string; alt: string }) {
  const { props } = getImageProps({ src: desktop, alt, fill: true, sizes: "100vw" });
  const { props: m } = getImageProps({ src: mobile, alt, fill: true, sizes: "100vw" });
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={props.srcSet} sizes="100vw" />
      <source media="(max-width: 767px)" srcSet={m.srcSet} sizes="100vw" />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is in props */}
      <img {...props} loading="lazy" className="absolute inset-0 size-full object-cover" />
    </picture>
  );
}

export function EditorialBanner() {
  const e = editorialBanner;
  return (
    <section aria-labelledby="editorial-heading" className="relative h-[700px] overflow-hidden bg-[#56604f] text-ivory md:h-[640px] xl:h-[780px]">
      <ArtBackground {...e.image} />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgb(30_27_25/0.5),rgb(30_27_25/0)_50%)] md:bg-[linear-gradient(90deg,rgb(30_27_25/0.3),rgb(30_27_25/0)_55%)]" />
      <div className="container-site relative flex h-full items-end pb-14 md:items-center md:pb-0">
        <div className="reveal mx-auto max-w-lg text-center md:mx-0 md:text-left">
          <p className="eyebrow !text-ivory">{e.eyebrow}</p>
          <h2 id="editorial-heading" className="heading-editorial mt-4">
            {e.title}
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ivory/90 md:text-[17px]">{e.text}</p>
          <Link href={e.cta.href} className={buttonClasses({ variant: "light", className: "mt-8 md:mt-10" })}>
            {e.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function CollectionSpotlight() {
  const s = collectionSpotlight;
  return (
    <section aria-labelledby="spotlight-heading" className="grid bg-sage md:grid-cols-2">
      <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[680px] xl:min-h-[820px]">
        <Image src={s.image} alt={s.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
      </div>
      <div className="flex items-center px-4 py-14 md:px-12 md:py-20 xl:px-28">
        <div className="reveal max-w-[470px]">
          <p className="eyebrow">{s.eyebrow}</p>
          <h2 id="spotlight-heading" className="heading-page mt-4">
            {s.title}
          </h2>
          <p className="mt-6 text-[15px] leading-[1.75] text-ink-2 md:text-[17px]">{s.text}</p>
          <dl className="my-10 grid grid-cols-3 border-y border-charcoal/15">
            {s.facts.map((f, i) => (
              <div key={f.label} className={i ? "border-l border-charcoal/15 py-5 pl-3 md:pl-5" : "py-5"}>
                <dt className="sr-only">{f.label}</dt>
                <dd>
                  <span className="block font-display text-[24px] leading-tight md:text-[30px]">{f.value}</span>
                  <span className="font-ui text-[11px] uppercase tracking-[0.12em] text-ink-2 md:text-[12px]">{f.label}</span>
                </dd>
              </div>
            ))}
          </dl>
          <ButtonLink href={s.cta.href} className="max-md:w-full">
            {s.cta.label}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function CustomerReviews({ average, count, reviews }: { average: number; count: number; reviews: (Review & { productName: string; productSlug: string })[] }) {
  if (!count) return null;
  return (
    <section aria-labelledby="reviews-heading" className="py-16 md:py-24 xl:py-32">
      <div className="container-site reveal">
        <div className="mb-10 text-center md:mb-14">
          <p className="eyebrow">Reviews</p>
          <h2 id="reviews-heading" className="heading-section mt-3">
            What Our Customers Say
          </h2>
          <div className="mt-7 inline-flex items-center gap-4 text-left">
            <span className="font-display text-[56px] leading-none md:text-[64px]">{average.toFixed(1)}</span>
            <div>
              <Stars value={average} size={16} />
              <p className="mt-1.5 text-[14px] text-ink-2">
                Based on <strong className="font-semibold text-charcoal">{count.toLocaleString("en-US")}</strong> customer reviews
              </p>
            </div>
          </div>
        </div>
        <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 lg:gap-6">
          {reviews.map((r) => (
            <li key={r.id} className="w-[86%] shrink-0 snap-start md:w-auto">
              <article className="flex h-full flex-col bg-cream p-7 md:p-10">
                <Stars value={r.rating} />
                <h3 className="mt-5 font-display text-[22px] leading-snug md:text-[26px]">“{r.title}”</h3>
                <p className="mt-3 flex-1 text-ink-2">{r.content}</p>
                <footer className="mt-7 border-t border-line pt-5">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <p className="font-ui text-[14px] font-medium tracking-[0.04em]">
                      {r.authorName}
                      <span className="block text-[12px] font-normal text-ink-3">{formatDate(r.createdAt)}</span>
                    </p>
                    {r.verifiedPurchase && <span className="font-ui text-[11px] font-medium uppercase tracking-[0.14em] text-success">✓ Verified Buyer</span>}
                  </div>
                  <p className="mt-2 font-ui text-[13px] text-ink-3">
                    Purchased:{" "}
                    <Link href={`/product/${r.productSlug}`} className="text-charcoal underline underline-offset-[3px]">
                      {r.productName}
                    </Link>
                  </p>
                </footer>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ServiceBenefits() {
  const items = [
    { icon: Globe, title: "Worldwide Shipping", text: "Delivered to 7 countries" },
    { icon: Repeat, title: "Easy Exchange", text: "Within 14 days of delivery" },
    { icon: Lock, title: "Secure Checkout", text: "Cards, wallets & COD" },
    { icon: MessageCircle, title: "Customer Support", text: site.contact.hours },
  ];
  return (
    <section aria-label="Our services" className="border-y border-line">
      <ul className="container-site grid grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }, i) => (
          <li
            key={title}
            className={[
              "flex flex-col items-center gap-3 px-2 py-7 text-center md:py-9 lg:flex-row lg:justify-center lg:gap-4 lg:text-left",
              i % 2 === 1 ? "border-l border-line" : "",
              i >= 2 ? "border-t border-line lg:border-t-0" : "",
              i === 2 ? "lg:border-l" : "",
            ].join(" ")}
          >
            <Icon className="size-7 shrink-0" strokeWidth={1.1} aria-hidden />
            <div>
              <p className="font-ui text-[12px] font-medium uppercase tracking-[0.14em] md:text-[13px] md:tracking-[0.16em]">{title}</p>
              <p className="text-[13px] text-ink-2">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SocialGallery() {
  return (
    <section aria-labelledby="gallery-heading" className="py-16 md:py-24 xl:py-32">
      <div className="container-site reveal">
        <SectionHeading id="gallery-heading" eyebrow={gallery.handle} title="Style With Us" align="center" />
        <ul className="grid auto-rows-[180px] grid-cols-2 gap-2 md:auto-rows-[220px] md:grid-cols-4 md:gap-3 xl:auto-rows-[300px]">
          {gallery.images.map((img, i) => (
            <li key={img.src} className={i === 0 || i === 3 ? "row-span-2" : i === 5 ? "max-md:row-span-2" : ""}>
              <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="group relative block size-full overflow-hidden bg-beige" aria-label={`${img.alt} — view on Instagram (opens in a new tab)`}>
                <Image src={img.src} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]" />
                <span className="absolute inset-0 grid place-items-center bg-charcoal/0 text-ivory opacity-0 transition-all duration-300 group-hover:bg-charcoal/20 group-hover:opacity-100 group-focus-visible:bg-charcoal/20 group-focus-visible:opacity-100">
                  <SocialIcon name="instagram" className="size-7" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function NewsletterSection() {
  return (
    <section aria-labelledby="newsletter-heading" className="bg-powder py-16 md:py-28">
      <div className="container-site reveal text-center">
        <p className="eyebrow">The AURAQ Letter</p>
        <h2 id="newsletter-heading" className="mt-4 font-display text-[40px] uppercase leading-none tracking-[0.04em] md:text-[60px]">
          Join Our World
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-ink-2 md:text-[17px]">Be the first to discover new collections, exclusive launches and private offers.</p>
        <div className="mt-8 text-left md:mt-10">
          <NewsletterForm variant="hero" source="homepage" />
        </div>
        <p className="mt-2 text-[13px] text-ink-2">
          By subscribing you agree to our{" "}
          <Link href="/privacy-policy" className="underline underline-offset-[3px]">
            Privacy Policy
          </Link>
          . Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}

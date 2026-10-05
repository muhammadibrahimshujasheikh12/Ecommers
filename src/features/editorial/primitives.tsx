import Image, { getImageProps } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Breadcrumbs, type Crumb } from "@/components/ui/misc";
import type { ArtImage } from "@/content/home";
import { cn } from "@/utils/cn";

export type Tone = "ivory" | "cream" | "blush" | "sage" | "powder" | "lavender";

export const toneBg: Record<Tone, string> = {
  ivory: "bg-ivory",
  cream: "bg-cream",
  blush: "bg-blush",
  sage: "bg-sage",
  powder: "bg-powder",
  lavender: "bg-lavender",
};

/** Art-directed full-bleed picture: separate desktop and mobile crops, one download. */
export function ArtPicture({ image, eager, className }: { image: ArtImage; eager?: boolean; className?: string }) {
  const common = {
    alt: image.alt,
    fill: true,
    sizes: "100vw",
    loading: eager ? ("eager" as const) : ("lazy" as const),
    fetchPriority: eager ? ("high" as const) : undefined,
  };
  const { props } = getImageProps({ ...common, src: image.desktop });
  const {
    props: { srcSet: mobileSrcSet },
  } = getImageProps({ ...common, src: image.mobile });
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={props.srcSet} sizes="100vw" />
      <source media="(max-width: 767px)" srcSet={mobileSrcSet} sizes="100vw" />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is in props */}
      <img {...props} className={cn("absolute inset-0 size-full object-cover", className)} />
    </picture>
  );
}

/** Full-bleed campaign hero carrying the page's h1, with breadcrumbs over the art. */
export function EditorialHero({ crumbs, eyebrow, title, text, image, fallbackBg = "bg-charcoal" }: { crumbs: Crumb[]; eyebrow: string; title: string; text: string; image: ArtImage; fallbackBg?: string }) {
  return (
    <section aria-labelledby="page-heading" className={cn("relative h-[min(86svh,760px)] min-h-[600px] overflow-hidden text-ivory md:h-[640px] xl:h-[780px]", fallbackBg)}>
      <ArtPicture image={image} eager />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgb(30_27_25/0.62),rgb(30_27_25/0)_58%)] md:bg-[linear-gradient(90deg,rgb(30_27_25/0.42),rgb(30_27_25/0)_60%)]" />
      <div className="container-site relative flex h-full flex-col pb-12 pt-6 md:pb-0 md:pt-8">
        <Breadcrumbs items={crumbs} className="text-ivory/90 [&_a:hover]:text-ivory [&_span[aria-current]]:text-ivory" />
        <div className="flex flex-1 items-end md:items-center">
          <div className="max-w-xl animate-fade-up">
            <p className="eyebrow !text-ivory">{eyebrow}</p>
            <h1 id="page-heading" className="heading-display mt-4">
              {title}
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ivory/90 md:text-[17px]">{text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Split page header for utility-led editorial pages (store locator, journal). */
export function PageIntro({
  crumbs,
  eyebrow,
  title,
  text,
  image,
  tone = "cream",
  children,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: string;
  text: string;
  image?: { src: string; alt: string };
  tone?: Tone;
  children?: ReactNode;
}) {
  return (
    <section aria-labelledby="page-heading" className={toneBg[tone]}>
      <div className="container-site grid grid-cols-[minmax(0,1fr)] items-center gap-8 py-8 md:grid-cols-[minmax(0,1fr)_340px] md:py-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
        <div className="min-w-0">
          <Breadcrumbs items={crumbs} />
          <p className="eyebrow mt-8 md:mt-10">{eyebrow}</p>
          <h1 id="page-heading" className="heading-page mt-3">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-ink-2 md:text-[16px]">{text}</p>
          {children}
        </div>
        {image && (
          <div className="relative hidden aspect-[4/5] max-h-[460px] overflow-hidden md:block">
            <Image src={image.src} alt={image.alt} fill loading="eager" fetchPriority="high" sizes="(min-width: 1024px) 420px, 340px" className="object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}

/** Alternating half-image / half-copy editorial block (as on the homepage spotlight). */
export function SplitFeature({ id, image, reverse, tone = "cream", children }: { id: string; image: { src: string; alt: string }; reverse?: boolean; tone?: Tone; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={cn("grid md:grid-cols-2", toneBg[tone])}>
      <div className={cn("relative aspect-[4/5] md:aspect-auto md:min-h-[640px] xl:min-h-[800px]", reverse && "md:order-last")}>
        <Image src={image.src} alt={image.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
      </div>
      <div className="flex items-center px-4 py-14 md:px-12 md:py-20 xl:px-24">
        <div className="reveal max-w-[520px]">{children}</div>
      </div>
    </section>
  );
}

export function PullQuote({ text, cite }: { text: string; cite: string }) {
  return (
    <figure className="my-14 border-y border-line py-10 text-center md:my-16 md:py-12">
      <span aria-hidden className="block h-8 font-display text-[96px] leading-[0.9] text-rose">
        “
      </span>
      <blockquote className="mx-auto mt-4 max-w-[600px] font-display text-[28px] italic leading-[1.25] text-charcoal md:text-[36px]">
        <p>{text}</p>
      </blockquote>
      <figcaption className="mt-6 font-ui text-[12px] font-medium uppercase tracking-[0.16em] text-ink-2">{cite}</figcaption>
    </figure>
  );
}

/**
 * Closing full-bleed band with two calls to action. On phones the art sits
 * above the copy (on `floorBg`, the art's floor colour) so two stacked
 * buttons never cover the figures; from tablet up the copy overlays the art.
 */
export function CtaBand({
  id,
  eyebrow,
  title,
  text,
  primary,
  secondary,
  image,
  floorBg = "bg-charcoal-soft",
}: {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  image: ArtImage;
  floorBg?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("relative overflow-hidden text-ivory md:h-[640px] xl:h-[780px]", floorBg)}>
      <div className="relative h-[400px] md:absolute md:inset-0 md:h-auto">
        <ArtPicture image={image} className="max-md:object-top" />
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(30_27_25/0.4),rgb(30_27_25/0)_55%)] md:block" />
      </div>
      <div className="container-site relative pb-16 pt-4 md:flex md:h-full md:items-center md:py-0">
        <div className="reveal mx-auto max-w-lg text-center md:mx-0 md:text-left">
          <p className="eyebrow !text-ivory">{eyebrow}</p>
          <h2 id={id} className="heading-editorial mt-4">
            {title}
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ivory/90 max-md:mx-auto md:text-[17px]">{text}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:mt-10 md:justify-start">
            <Link href={primary.href} className={buttonClasses({ variant: "light" })}>
              {primary.label}
            </Link>
            {secondary && (
              <Link href={secondary.href} className={buttonClasses({ variant: "outline-light" })}>
                {secondary.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { siteUrl } from "@/lib/env";
import { site } from "@/content/site";
import type { ProductDetail, Review, ReviewSummary } from "@/types/domain";

export const absoluteUrl = (path = "/") => (/^https?:\/\//.test(path) ? path : `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`);

type MetaInput = {
  title: string;
  description?: string;
  path: string;
  images?: { url: string; alt?: string }[];
  noIndex?: boolean;
  type?: "website" | "article";
};

/** Consistent title/description/canonical/Open Graph/Twitter for every page. */
export function buildMetadata({ title, description = site.description, path, images, noIndex, type = "website" }: MetaInput): Metadata {
  const url = absoluteUrl(path);
  const ogImages = (images?.length ? images : [{ url: "/images/og-default.jpg", alt: site.name }]).map((i) => ({
    url: absoluteUrl(i.url),
    alt: i.alt ?? title,
  }));
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: site.name, locale: site.locale, type, images: ogImages },
    twitter: { card: "summary_large_image", title, description, images: ogImages.map((i) => i.url) },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}

// ---------------------------------------------------------------------------
// JSON-LD (schema.org)
// ---------------------------------------------------------------------------
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: site.name,
    legalName: site.legalName,
    url: siteUrl,
    logo: absoluteUrl("/icon.png"),
    email: site.contact.email,
    telephone: site.contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.contact.address.street,
      addressLocality: site.contact.address.city,
      addressRegion: site.contact.address.region,
      postalCode: site.contact.address.postalCode,
      addressCountry: site.contact.address.country,
    },
    sameAs: Object.values(site.social),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: site.name,
    url: siteUrl,
    publisher: { "@id": `${siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/shop?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productJsonLd(product: ProductDetail, summary: ReviewSummary, reviews: Review[]) {
  const url = absoluteUrl(`/product/${product.slug}`);
  const prices = product.variants.length ? product.variants.map((v) => v.price) : [product.price];
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const availability = product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    sku: product.sku,
    url,
    image: product.images.map((i) => absoluteUrl(i.url)),
    brand: { "@type": "Brand", name: site.name },
    category: product.category?.name,
    material: product.material ?? undefined,
    color: product.colors.map((c) => c.name).join(", ") || undefined,
    offers:
      low === high
        ? {
            "@type": "Offer",
            url,
            priceCurrency: "PKR",
            price: low.toFixed(2),
            availability,
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@id": `${siteUrl}/#organization` },
          }
        : {
            "@type": "AggregateOffer",
            priceCurrency: "PKR",
            lowPrice: low.toFixed(2),
            highPrice: high.toFixed(2),
            offerCount: product.variants.length,
            availability,
          },
    aggregateRating:
      summary.count > 0
        ? { "@type": "AggregateRating", ratingValue: summary.average.toFixed(1), reviewCount: summary.count, bestRating: 5, worstRating: 1 }
        : undefined,
    review: reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      name: r.title,
      reviewBody: r.content,
      datePublished: r.createdAt.slice(0, 10),
      author: { "@type": "Person", name: r.authorName },
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    })),
  };
}

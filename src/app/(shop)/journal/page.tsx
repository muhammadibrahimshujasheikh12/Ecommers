import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs, SectionHeading } from "@/components/ui/misc";
import { JsonLd } from "@/components/ui/content";
import { ArticleCard, FeaturedArticle, articleHref } from "@/features/editorial/journal";
import { SplitFeature } from "@/features/editorial/primitives";
import { journalAuthors, sortedArticles } from "@/content/journal";
import { site } from "@/content/site";
import { siteUrl } from "@/lib/env";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

const DESCRIPTION = "The AURAQ Journal: notes from our Lahore atelier on craft and fabric care, festive styling and the stories behind every collection.";

export const metadata: Metadata = buildMetadata({
  title: "Journal",
  description: DESCRIPTION,
  path: "/journal",
  images: [{ url: sortedArticles[0].image.src, alt: sortedArticles[0].image.alt }],
});

export default function JournalPage() {
  const featured = sortedArticles.find((a) => a.featured) ?? sortedArticles[0];
  const rest = sortedArticles.filter((a) => a.slug !== featured.slug);

  return (
    <>
      <div className="container-site pt-8 md:pt-10">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Journal" }]} />
        <header className="mx-auto mt-10 max-w-3xl text-center md:mt-14">
          <p className="eyebrow">The AURAQ Journal</p>
          <h1 className="heading-display mt-4">Journal</h1>
          <p className="mx-auto mt-5 max-w-xl text-ink-2 md:text-[17px]">Notes from our Lahore atelier on craft and care, styling and the stories behind every collection.</p>
        </header>
      </div>

      <div className="container-site py-12 md:py-20">
        <FeaturedArticle article={featured} />
      </div>

      <section aria-labelledby="latest-heading" className="container-site pb-16 md:pb-24 xl:pb-32">
        <div className="reveal border-t border-line pt-12 md:pt-16">
          <SectionHeading id="latest-heading" eyebrow="Latest" title="All Stories" />
          <ul className="grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-4">
            {rest.map((a) => (
              <li key={a.slug}>
                <ArticleCard article={a} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <SplitFeature id="atelier-teaser-heading" image={{ src: "/images/pages/craft-resham.jpg", alt: "Swatches of blush, sage and ivory silk embroidered with resham borders" }} tone="blush">
        <p className="eyebrow">From the Atelier</p>
        <h2 id="atelier-teaser-heading" className="heading-page mt-4">
          The Hands Behind Every Page
        </h2>
        <p className="mt-6 text-[15px] leading-[1.8] text-ink-2 md:text-[17px]">
          More than two hundred karigars, five centuries-old techniques and up to 120 hours on a single shirt. Discover how AURAQ began, and how every piece is still made by hand in Lahore.
        </p>
        <ButtonLink href="/about" className="mt-9 max-md:w-full">
          Read Our Story
        </ButtonLink>
      </SplitFeature>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            "@id": `${siteUrl}/journal#blog`,
            name: `${site.name} Journal`,
            description: DESCRIPTION,
            url: absoluteUrl("/journal"),
            publisher: { "@id": `${siteUrl}/#organization` },
            blogPost: sortedArticles.map((a) => ({
              "@type": "BlogPosting",
              headline: a.title,
              url: absoluteUrl(articleHref(a)),
              image: absoluteUrl(a.image.src),
              datePublished: a.publishedAt,
              author: { "@type": "Person", name: journalAuthors[a.author].name },
            })),
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Journal", path: "/journal" },
          ]),
        ]}
      />
    </>
  );
}

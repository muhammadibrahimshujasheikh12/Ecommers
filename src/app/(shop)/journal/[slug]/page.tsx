import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/misc";
import { JsonLd, Markdown } from "@/components/ui/content";
import { ProductRail } from "@/features/home/sections";
import { ArticleFigure, ArticleHeader, AuthorCard, MoreStories, ShareLinks, articleHref, articleJsonLd } from "@/features/editorial/journal";
import { PullQuote } from "@/features/editorial/primitives";
import { getArticle, journalArticles, journalAuthors, sortedArticles } from "@/content/journal";
import { getProductsBySlugs } from "@/lib/data/catalog";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return journalArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Story not found", robots: { index: false } };
  const base = buildMetadata({
    title: article.title,
    description: article.excerpt,
    path: articleHref(article),
    type: "article",
    images: [{ url: article.image.src, alt: article.image.alt }],
  });
  return {
    ...base,
    authors: [{ name: journalAuthors[article.author].name }],
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt ?? article.publishedAt,
      authors: [journalAuthors[article.author].name],
      section: article.category,
    },
  };
}

export default async function JournalArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const products = await getProductsBySlugs(article.shop.slugs);
  // Up to three other stories, newest first.
  const more = sortedArticles.filter((a) => a.slug !== article.slug).slice(0, 3);
  const crumbs = [{ name: "Home", href: "/" }, { name: "Journal", href: "/journal" }, { name: article.title }];

  return (
    <>
      <article aria-labelledby="article-heading">
        <div className="container-site pt-6 md:pt-8">
          <Breadcrumbs items={crumbs} className="mb-8 md:mb-12" />
          <ArticleHeader article={article} />
        </div>

        <div className="container-site pb-16 pt-12 md:pb-24 md:pt-20">
          <div className="mx-auto max-w-[720px] [&_.prose-auraq]:text-[16px] [&_.prose-auraq]:leading-[1.85] [&_.prose-auraq>h2:first-child]:mt-0">
            <p className="mb-10 font-display text-[24px] leading-[1.4] text-charcoal first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-display first-letter:text-[72px] first-letter:leading-[0.8] md:text-[28px] md:first-letter:text-[88px]">
              {article.intro}
            </p>
            <Markdown source={article.body} />
            <PullQuote text={article.pullQuote.text} cite={article.pullQuote.cite} />
            <ArticleFigure figure={article.figure} />
            <Markdown source={article.bodyAfter} />
            <ShareLinks article={article} />
            <AuthorCard article={article} />
          </div>
        </div>
      </article>

      <ProductRail id="shop-the-story" eyebrow="Shop the Story" title={article.shop.title} href={article.shop.href} linkLabel={article.shop.linkLabel} products={products} centered tone="cream" />

      <MoreStories articles={more} />

      <JsonLd data={[articleJsonLd(article), breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, path: c.href ?? articleHref(article) })))]} />
    </>
  );
}

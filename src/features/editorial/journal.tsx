import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { SocialIcon } from "@/components/ui/content";
import { journalAuthors, readingMinutes, type JournalArticle } from "@/content/journal";
import { site } from "@/content/site";
import { siteUrl } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";
import { formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";

export const articleHref = (a: JournalArticle) => `/journal/${a.slug}`;

/** "Mahnoor Aziz · 24 Sept 2026 · 5 min read" */
export function ArticleMeta({ article, showAuthor = true, className }: { article: JournalArticle; showAuthor?: boolean; className?: string }) {
  const author = journalAuthors[article.author];
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1 font-ui text-[12px] tracking-[0.06em] text-ink-2", className)}>
      {showAuthor && (
        <>
          <span className="text-charcoal">{author.name}</span>
          <span aria-hidden>·</span>
        </>
      )}
      <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, true)}</time>
      <span aria-hidden>·</span>
      <span>{readingMinutes(article)} min read</span>
    </p>
  );
}

export function ArticleCard({ article, sizes = "(min-width: 1024px) 23vw, (min-width: 768px) 46vw, 100vw" }: { article: JournalArticle; sizes?: string }) {
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-beige">
        <Image src={article.image.src} alt={article.image.alt} fill sizes={sizes} className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-standard)] group-hover:scale-[1.03]" />
      </div>
      <p className="eyebrow mt-5">{article.category}</p>
      <h3 className="mt-2 font-display text-[26px] leading-[1.15] md:text-[28px]">
        <Link href={articleHref(article)} className="after:absolute after:inset-0">
          <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">{article.title}</span>
        </Link>
      </h3>
      <p className="mt-3 line-clamp-3 text-[14px] leading-[1.7] text-ink-2">{article.excerpt}</p>
      <ArticleMeta article={article} showAuthor={false} className="mt-4" />
    </article>
  );
}

export function FeaturedArticle({ article }: { article: JournalArticle }) {
  return (
    <article aria-labelledby="featured-heading" className="group relative grid gap-8 md:grid-cols-2 md:items-center md:gap-12 lg:gap-20">
      <div className="relative aspect-[4/5] overflow-hidden bg-beige">
        <Image src={article.image.src} alt={article.image.alt} fill loading="eager" fetchPriority="high" sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-standard)] group-hover:scale-[1.03]" />
      </div>
      <div className="max-w-[540px]">
        <p className="eyebrow">Featured · {article.category}</p>
        <h2 id="featured-heading" className="heading-page mt-4">
          <Link href={articleHref(article)} className="after:absolute after:inset-0">
            {article.title}
          </Link>
        </h2>
        <p className="mt-5 text-[15px] leading-[1.8] text-ink-2 md:text-[17px]">{article.excerpt}</p>
        <ArticleMeta article={article} className="mt-6" />
        <span aria-hidden className={buttonClasses({ variant: "secondary", className: "mt-9 max-md:w-full" })}>
          Read the Story
        </span>
      </div>
    </article>
  );
}

export function ArticleHeader({ article }: { article: JournalArticle }) {
  const author = journalAuthors[article.author];
  return (
    <header className="grid gap-8 md:grid-cols-2 md:items-center md:gap-12 lg:gap-20">
      <div className="max-w-[600px]">
        <p className="eyebrow">{article.category}</p>
        <h1 id="article-heading" className="heading-page mt-4">
          {article.title}
        </h1>
        <p className="mt-5 text-[16px] leading-[1.75] text-ink-2 md:text-[18px]">{article.excerpt}</p>
        <div className="mt-8 flex items-center gap-4 border-t border-line pt-6">
          <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-blush font-display text-[20px]">
            {author.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
          <div>
            <p className="font-ui text-[14px] font-medium tracking-[0.02em]">
              <span className="sr-only">By </span>
              {author.name}
              <span className="font-normal text-ink-2">, {author.role}</span>
            </p>
            <ArticleMeta article={article} showAuthor={false} className="mt-1" />
          </div>
        </div>
      </div>
      <div className="relative -mx-4 aspect-[4/5] overflow-hidden bg-beige md:mx-0">
        <Image src={article.image.src} alt={article.image.alt} fill loading="eager" fetchPriority="high" sizes="(min-width: 1440px) 660px, (min-width: 768px) 50vw, 100vw" className="object-cover" />
      </div>
    </header>
  );
}

export function ArticleFigure({ figure }: { figure: JournalArticle["figure"] }) {
  return (
    <figure className="mx-auto my-14 max-w-[560px] md:my-16">
      <div className="relative aspect-[4/5] overflow-hidden bg-beige">
        <Image src={figure.src} alt={figure.alt} fill sizes="(min-width: 640px) 560px, 100vw" className="object-cover" />
      </div>
      <figcaption className="mt-3 font-ui text-[13px] leading-relaxed text-ink-3">{figure.caption}</figcaption>
    </figure>
  );
}

export function AuthorCard({ article }: { article: JournalArticle }) {
  const author = journalAuthors[article.author];
  return (
    <aside aria-label="About the author" className="mt-14 flex gap-5 bg-cream p-6 md:p-8">
      <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-blush font-display text-[22px]">
        {author.name
          .split(" ")
          .map((n) => n[0])
          .join("")}
      </span>
      <div>
        <p className="eyebrow">Written by</p>
        <p className="mt-1 font-display text-[24px] leading-tight">
          {author.name}
          <span className="ml-2 font-ui text-[13px] text-ink-2">{author.role}</span>
        </p>
        <p className="mt-2 text-[14px] leading-[1.7] text-ink-2">{author.bio}</p>
      </div>
    </aside>
  );
}

export function ShareLinks({ article }: { article: JournalArticle }) {
  const url = absoluteUrl(articleHref(article));
  const text = `${article.title} | ${site.name} Journal`;
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, icon: <MessageCircle className="size-[18px]" strokeWidth={1.3} aria-hidden /> },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, icon: <SocialIcon name="facebook" /> },
    {
      label: "Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(absoluteUrl(article.image.src))}&description=${encodeURIComponent(text)}`,
      icon: <SocialIcon name="pinterest" />,
    },
  ];
  return (
    <div className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-6">
      <p className="ui-label text-[11px] text-ink-2">Share this story</p>
      <ul className="flex gap-2">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} target="_blank" rel="noopener noreferrer" className="grid size-10 place-items-center rounded-full border border-line-strong transition-colors hover:border-charcoal">
              {l.icon}
              <span className="sr-only">Share on {l.label} (opens in a new tab)</span>
            </a>
          </li>
        ))}
        <li>
          <a href={`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`} className="grid size-10 place-items-center rounded-full border border-line-strong transition-colors hover:border-charcoal">
            <Mail className="size-[18px]" strokeWidth={1.3} aria-hidden />
            <span className="sr-only">Share by email</span>
          </a>
        </li>
      </ul>
    </div>
  );
}

export function MoreStories({ articles, title = "More from the Journal" }: { articles: JournalArticle[]; title?: string }) {
  if (!articles.length) return null;
  return (
    <section aria-labelledby="more-stories-heading" className="container-site py-16 md:py-24 xl:py-28">
      <div className="reveal">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 md:mb-12">
          <div>
            <p className="eyebrow mb-3">Keep Reading</p>
            <h2 id="more-stories-heading" className="heading-section">
              {title}
            </h2>
          </div>
          <Link href="/journal" className="link-underline ui-label inline-flex items-center gap-2 text-[12px]">
            All Stories <ArrowRight className="size-4" strokeWidth={1.4} aria-hidden />
          </Link>
        </div>
        <ul className="grid gap-x-6 gap-y-12 md:grid-cols-3">
          {articles.map((a) => (
            <li key={a.slug}>
              <ArticleCard article={a} sizes="(min-width: 768px) 31vw, 100vw" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function articleJsonLd(article: JournalArticle) {
  const author = journalAuthors[article.author];
  const url = absoluteUrl(articleHref(article));
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: article.title,
    description: article.excerpt,
    image: [absoluteUrl(article.image.src)],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    articleSection: article.category,
    timeRequired: `PT${readingMinutes(article)}M`,
    author: { "@type": "Person", name: author.name, jobTitle: author.role },
    publisher: { "@id": `${siteUrl}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: { "@type": "Blog", name: `${site.name} Journal`, url: absoluteUrl("/journal") },
  };
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/misc";
import { JsonLd, Markdown } from "@/components/ui/content";
import { getPage } from "@/lib/data/pages";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { parseMarkdown } from "@/utils/markdown";
import { formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";

const RELATED = [
  { slug: "shipping-policy", label: "Shipping Policy" },
  { slug: "return-policy", label: "Return & Exchange Policy" },
  { slug: "cancellation-policy", label: "Cancellation Policy" },
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "terms-and-conditions", label: "Terms & Conditions" },
  { slug: "faqs", label: "FAQs" },
  { slug: "contact", label: "Contact Us" },
];

export async function contentPageMetadata(slug: string): Promise<Metadata> {
  const page = await getPage(slug);
  if (!page) return { title: "Page not found" };
  return buildMetadata({ title: page.title, description: page.summary ?? undefined, path: `/${slug}`, type: "article" });
}

/** Policy & information pages, rendered from editable Markdown in the `pages` table. */
export async function ContentPage({ slug }: { slug: string }) {
  const page = await getPage(slug);
  if (!page) notFound();
  const headings = parseMarkdown(page.content).filter((b): b is Extract<typeof b, { type: "heading" }> => b.type === "heading" && b.level === 2);
  const showToc = headings.length >= 3;

  return (
    <article className="container-site pb-24 pt-8 md:pt-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: page.title }]} />
      <header className="mx-auto mt-10 max-w-3xl text-center md:mt-14">
        <h1 className="heading-page">{page.title}</h1>
        {page.summary && <p className="mt-4 text-ink-2 md:text-[17px]">{page.summary}</p>}
        <p className="mt-4 font-ui text-[12px] uppercase tracking-[0.14em] text-ink-3">
          Last updated <time dateTime={page.updatedAt}>{formatDate(page.updatedAt, true)}</time>
        </p>
      </header>

      <div className={cn("mx-auto mt-12 grid gap-12 md:mt-16", showToc ? "max-w-6xl lg:grid-cols-[240px_1fr]" : "max-w-3xl")}>
        {showToc && (
          <aside className="lg:sticky lg:top-[150px] lg:self-start">
            <nav aria-label="On this page" className="bg-cream p-6 lg:bg-transparent lg:p-0">
              <p className="mb-4 font-ui text-[12px] font-medium uppercase tracking-[0.16em]">On this page</p>
              <ol className="space-y-2.5 font-ui text-[14px]">
                {headings.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="text-ink-2 hover:text-charcoal hover:underline hover:underline-offset-4">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        )}
        <div className="max-w-[720px] [&_.prose-auraq>h2:first-child]:mt-0">
          <Markdown source={page.content} />
          <nav aria-label="More information" className="mt-16 border-t border-line pt-8">
            <p className="mb-4 font-ui text-[12px] font-medium uppercase tracking-[0.16em]">More information</p>
            <ul className="flex flex-wrap gap-2">
              {RELATED.filter((r) => r.slug !== slug).map((r) => (
                <li key={r.slug}>
                  <Link href={`/${r.slug}`} className="inline-flex h-9 items-center rounded-full border border-line-strong px-4 font-ui text-[13px] hover:border-charcoal">
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: page.title, path: `/${slug}` }])} />
    </article>
  );
}

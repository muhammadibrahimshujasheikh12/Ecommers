import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/misc";
import { getCollections } from "@/lib/data/catalog";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/utils/cn";

export const metadata: Metadata = buildMetadata({
  title: "Collections",
  description: "Explore AURAQ collections — The Festive Edit, Mehr-o-Mah Luxury, Summer Lawn and The Signature Collection.",
  path: "/collections",
});

export default async function CollectionsPage() {
  const collections = await getCollections();
  return (
    <div className="container-site pb-20 pt-8 md:pb-28 md:pt-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Collections" }]} />
      <header className="mb-12 mt-8 max-w-2xl md:mb-16 md:mt-10">
        <p className="eyebrow">Discover</p>
        <h1 className="heading-page mt-3">Collections</h1>
        <p className="mt-4 text-ink-2">Each season tells a story. Explore our campaigns and the pieces that define them.</p>
      </header>
      <ul className="grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((c, i) => (
          <li key={c.id} className={cn(i === 0 && "md:col-span-2 lg:col-span-2 lg:row-span-2")}>
            <Link href={`/collections/${c.slug}`} className="group block">
              <div className={cn("relative overflow-hidden bg-beige", i === 0 ? "aspect-[4/5] md:aspect-[16/10] lg:aspect-[4/3.6]" : "aspect-[4/5]")}>
                {c.imageUrl && (
                  <Image src={c.imageUrl} alt="" fill priority={i < 2} sizes={i === 0 ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"} className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]" />
                )}
              </div>
              <h2 className={cn("mt-5 font-display leading-tight", i === 0 ? "text-[34px] md:text-[44px]" : "text-[28px]")}>{c.name}</h2>
              {c.description && <p className="mt-2 max-w-md text-ink-2">{c.description}</p>}
              <span className="link-underline ui-label mt-4 inline-flex items-center gap-2 text-[12px]">
                Shop the collection <ArrowRight className="size-4" strokeWidth={1.4} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

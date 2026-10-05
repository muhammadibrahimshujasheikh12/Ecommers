import type { Metadata } from "next";
import { JsonLd } from "@/components/ui/content";
import { PageIntro } from "@/features/editorial/primitives";
import { StoreFilter } from "@/features/editorial/store-filter";
import { AppointmentBand, ServicesGlossary, StoreCard, storesJsonLd } from "@/features/editorial/stores";
import { stores, storesIntro } from "@/content/stores";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Store Locator",
  description:
    "Visit AURAQ boutiques in Lahore (MM Alam Road flagship and Emporium Mall), Karachi (Dolmen Mall Clifton), Islamabad (The Centaurus) and The Dubai Mall. Addresses, opening hours, directions and in-store styling.",
  path: "/stores",
  images: [{ url: storesIntro.image.src, alt: storesIntro.image.alt }],
});

export default function StoresPage() {
  const cityCount = new Set(stores.map((s) => s.city)).size;
  const facts = [`${stores.length} boutiques`, `${cityCount} cities`, "Open 7 days a week", "Stylists in every store"];

  return (
    <>
      <PageIntro crumbs={[{ name: "Home", href: "/" }, { name: "Store Locator" }]} eyebrow={storesIntro.eyebrow} title={storesIntro.title} text={storesIntro.text} image={storesIntro.image}>
        <ul className="mt-8 grid max-w-md grid-cols-2 gap-x-6 gap-y-3 font-ui text-[12px] font-medium uppercase tracking-[0.14em] xl:flex xl:max-w-none xl:gap-x-6">
          {facts.map((f, i) => (
            <li key={f} className="flex items-center gap-6">
              {i > 0 && <span aria-hidden className="hidden size-1 rounded-full bg-charcoal/40 xl:block" />}
              {f}
            </li>
          ))}
        </ul>
      </PageIntro>

      <div className="container-site pt-10 md:pt-14">
        <StoreFilter items={stores.map((s) => ({ key: s.id, city: s.city, node: <StoreCard store={s} /> }))} />
        <ServicesGlossary />
      </div>

      <AppointmentBand />

      <JsonLd
        data={[
          ...storesJsonLd(stores),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Store Locator", path: "/stores" },
          ]),
        ]}
      />
    </>
  );
}

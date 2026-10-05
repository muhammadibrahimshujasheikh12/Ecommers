import type { Metadata } from "next";
import { JsonLd } from "@/components/ui/content";
import { AboutIntro, AtelierFeature, CraftTechniques, FounderNote, NumbersBand, ProcessTimeline, ValuesGrid } from "@/features/editorial/about-sections";
import { CtaBand, EditorialHero } from "@/features/editorial/primitives";
import { aboutCta, aboutHero } from "@/content/about";
import { siteUrl } from "@/lib/env";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { site } from "@/content/site";

const DESCRIPTION =
  "The story of AURAQ: a Lahore atelier of more than 200 karigars hand-finishing zardozi, tilla, gota, resham and mukesh since 2015. Meet our founder and see how every piece is made.";

export const metadata: Metadata = buildMetadata({
  title: "Our Story",
  description: DESCRIPTION,
  path: "/about",
  images: [{ url: aboutHero.image.desktop, alt: aboutHero.image.alt }],
});

export default function AboutPage() {
  return (
    <>
      <EditorialHero crumbs={[{ name: "Home", href: "/" }, { name: "Our Story" }]} eyebrow={aboutHero.eyebrow} title={aboutHero.title} text={aboutHero.text} image={aboutHero.image} fallbackBg="bg-[#6f5e54]" />
      <AboutIntro />
      <FounderNote />
      <AtelierFeature />
      <CraftTechniques />
      <NumbersBand />
      <ValuesGrid />
      <ProcessTimeline />
      <CtaBand id="about-cta-heading" {...aboutCta} floorBg="bg-[#4f424c]" />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: `Our Story | ${site.name}`,
            description: DESCRIPTION,
            url: absoluteUrl("/about"),
            image: absoluteUrl(aboutHero.image.desktop),
            about: { "@id": `${siteUrl}/#organization` },
            isPartOf: { "@id": `${siteUrl}/#website` },
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Our Story", path: "/about" },
          ]),
        ]}
      />
    </>
  );
}

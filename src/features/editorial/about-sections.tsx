import Image from "next/image";
import { Gem, Leaf, Layers, Ruler } from "lucide-react";
import { SectionHeading } from "@/components/ui/misc";
import { aboutIntro, aboutNumbers, aboutProcess, aboutValues, atelier, craftTechniques, founderNote } from "@/content/about";
import { SplitFeature } from "./primitives";
import { cn } from "@/utils/cn";

export function AboutIntro() {
  return (
    <section aria-labelledby="name-heading" className="container-site reveal py-16 text-center md:py-24 xl:py-32">
      <p lang="ur" dir="rtl" className="text-[40px] leading-none text-ink-3 md:text-[56px]">
        {aboutIntro.urdu}
      </p>
      <h2 id="name-heading" className="heading-page mx-auto mt-6 max-w-3xl">
        {aboutIntro.lead}
      </h2>
      <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-[1.8] text-ink-2 md:text-[18px]">{aboutIntro.text}</p>
    </section>
  );
}

export function FounderNote() {
  const f = founderNote;
  return (
    <SplitFeature id="founder-heading" image={f.image} tone="cream">
      <p className="eyebrow">{f.eyebrow}</p>
      <h2 id="founder-heading" className="heading-page mt-4">
        {f.title}
      </h2>
      <div className="mt-7 space-y-4 text-[15px] leading-[1.8] text-ink-2 md:text-[16px]">
        {f.paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
      <p className="mt-9 font-display text-[34px] italic leading-none text-charcoal">{f.signature}</p>
      <p className="ui-label mt-3 text-ink-2">{f.role}</p>
    </SplitFeature>
  );
}

export function AtelierFeature() {
  return (
    <SplitFeature id="atelier-heading" image={atelier.image} tone="sage" reverse>
      <p className="eyebrow">{atelier.eyebrow}</p>
      <h2 id="atelier-heading" className="heading-page mt-4">
        {atelier.title}
      </h2>
      <div className="mt-7 space-y-4 text-[15px] leading-[1.8] text-ink-2 md:text-[16px]">
        {atelier.paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
    </SplitFeature>
  );
}

export function CraftTechniques() {
  return (
    <section aria-labelledby="craft-heading" className="py-16 md:py-24 xl:py-32">
      <div className="container-site reveal mb-8 grid gap-4 md:mb-12 lg:grid-cols-2 lg:items-end lg:gap-16">
        <div>
          <p className="eyebrow mb-3">The Craft</p>
          <h2 id="craft-heading" className="heading-section">
            The Language of Handwork
          </h2>
        </div>
        <p className="max-w-xl text-ink-2 md:text-[16px]">
          Five techniques, each with centuries behind it, and each still worked entirely by hand in our atelier. This is what to look for in an AURAQ piece.
        </p>
      </div>
      <ul className="scrollbar-none container-site flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-4 md:gap-5 lg:grid lg:grid-cols-5 lg:gap-6 lg:overflow-visible">
        {craftTechniques.map((t) => (
          <li key={t.name} className="w-[78%] shrink-0 snap-start sm:w-[46%] md:w-[38%] lg:w-auto">
            <article>
              <div className="relative aspect-[4/5] overflow-hidden bg-beige">
                <Image src={t.image.src} alt={t.image.alt} fill sizes="(min-width: 1024px) 19vw, (min-width: 768px) 38vw, (min-width: 640px) 46vw, 78vw" className="object-cover" />
              </div>
              <h3 className="mt-5 flex items-baseline justify-between gap-3 font-display text-[28px] leading-tight">
                {t.name}
                <span lang="ur" dir="rtl" className="font-body text-[18px] text-ink-3">
                  {t.urdu}
                </span>
              </h3>
              <p className="mt-2 text-[14px] leading-[1.75] text-ink-2">{t.text}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NumbersBand() {
  return (
    <section aria-labelledby="numbers-heading" className="bg-blush py-16 md:py-20 xl:py-24">
      <div className="container-site reveal">
        <div className="mb-10 text-center md:mb-14">
          <p className="eyebrow">By the Numbers</p>
          <h2 id="numbers-heading" className="heading-section mt-3">
            AURAQ in Figures
          </h2>
        </div>
        <dl className="grid grid-cols-2 border-y border-charcoal/15 lg:grid-cols-4">
          {aboutNumbers.map((n, i) => (
            <div
              key={n.label}
              className={cn(
                "flex flex-col items-center px-3 py-8 text-center md:py-10",
                i % 2 === 1 && "border-l border-charcoal/15",
                i >= 2 && "border-t border-charcoal/15 lg:border-t-0",
                i === 2 && "lg:border-l",
              )}
            >
              <dt className="order-2 mt-3 font-ui text-[11px] font-medium uppercase tracking-[0.16em] md:text-[12px]">{n.label}</dt>
              <dd className="order-1 font-display text-[52px] leading-none md:text-[72px]">{n.value}</dd>
              <dd className="order-3 mt-2 max-w-[220px] text-[13px] leading-snug text-ink-2">{n.note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

const VALUE_ICONS = { craft: Gem, fabric: Layers, fit: Ruler, responsible: Leaf } as const;

export function ValuesGrid() {
  return (
    <section aria-labelledby="values-heading" className="py-16 md:py-24 xl:py-32">
      <div className="container-site reveal">
        <SectionHeading id="values-heading" eyebrow="What We Stand For" title="Our Values" />
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {aboutValues.map((v) => {
            const Icon = VALUE_ICONS[v.icon];
            return (
              <li key={v.title} className="border-t border-charcoal pt-7">
                <Icon className="size-8" strokeWidth={1.1} aria-hidden />
                <h3 className="mt-6 font-display text-[28px] leading-tight">{v.title}</h3>
                <p className="mt-3 text-[15px] leading-[1.75] text-ink-2">{v.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function ProcessTimeline() {
  return (
    <section aria-labelledby="process-heading" className="bg-cream py-16 md:py-24 xl:py-32">
      <div className="container-site reveal">
        <SectionHeading id="process-heading" eyebrow="The Process" title="From Sketch to Finish" align="center" />
        <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-8 lg:before:absolute lg:before:inset-x-0 lg:before:top-7 lg:before:h-px lg:before:bg-line-strong">
          {aboutProcess.map((s, i) => (
            <li
              key={s.step}
              className={cn(
                "relative pl-20 lg:pl-0",
                i < aboutProcess.length - 1 && "before:absolute before:-bottom-10 before:left-7 before:top-14 before:w-px before:bg-line-strong lg:before:hidden",
              )}
            >
              <span aria-hidden className="absolute left-0 top-0 grid size-14 place-items-center rounded-full border border-charcoal bg-cream font-display text-[22px] lg:relative">
                {s.step}
              </span>
              <p className="eyebrow pt-1 lg:mt-7 lg:pt-0">{s.duration}</p>
              <h3 className="mt-2 font-display text-[30px] leading-tight">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-3 max-w-md text-[15px] leading-[1.75] text-ink-2">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

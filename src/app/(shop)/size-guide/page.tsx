import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, Plus } from "lucide-react";
import { Breadcrumbs, SectionHeading } from "@/components/ui/misc";
import { buttonClasses } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/content";
import { SizeGuideTable } from "@/features/product/purchase-panel";
import { customStitching, fitNotes, howToMeasure, internationalSizes, measuringTips, sizeGuide, unstitchedGuide } from "@/content/size-guide";
import { site } from "@/content/site";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { formatPrice } from "@/utils/format";

const TITLE = "Size Guide";

const SECTIONS = [
  { id: "size-chart", label: "Size chart" },
  { id: "how-to-measure", label: "How to measure" },
  { id: "fit-notes", label: "Fit notes" },
  { id: "unstitched", label: "Unstitched fabric" },
  { id: "made-to-measure", label: "Made to measure" },
];

export const metadata: Metadata = buildMetadata({
  title: TITLE,
  description:
    "Find your AURAQ size: body measurements in inches and centimetres, how to measure, fit notes for kurtas, trousers and dupattas, unstitched fabric lengths and made-to-measure stitching from our Lahore atelier.",
  path: "/size-guide",
});

const arrow = <ArrowRight className="size-4" strokeWidth={1.4} aria-hidden />;

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

function DataTable({ caption, columns, rows, unit = "" }: { caption: string; columns: readonly string[]; rows: readonly (readonly string[])[]; unit?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[300px] border-collapse font-ui text-[14px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" className="border-b border-charcoal py-3 pr-4 text-left text-[12px] font-medium uppercase tracking-[0.12em]">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([first, ...rest]) => (
            <tr key={first}>
              <th scope="row" className="border-b border-line py-3 pr-4 text-left font-medium">
                {first}
              </th>
              {rest.map((cell, i) => (
                <td key={i} className="whitespace-nowrap border-b border-line py-3 pr-4 text-ink-2">
                  {cell}
                  {unit}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const cmRows = sizeGuide.rows.map(([size, ...inches]) => [size, ...inches.map((v) => String(Math.round(Number(v) * 2.54)))]);

// ---------------------------------------------------------------------------
// Illustrations
// ---------------------------------------------------------------------------

function Marker({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="11" className="fill-charcoal" />
      <text x={x} y={y + 4} textAnchor="middle" className="fill-ivory font-ui text-[11px] font-semibold">
        {n}
      </text>
    </g>
  );
}

/** A figure in kurta and trousers with the five measurements from the list beside it. */
function MeasureDiagram() {
  const tape = "fill-none stroke-charcoal [stroke-dasharray:4_3] [stroke-width:1.5]";
  const guide = "fill-none stroke-ink-3 [stroke-dasharray:2_3] [stroke-width:0.8]";
  const outline = "stroke-charcoal [stroke-width:1.2] [stroke-linejoin:round]";
  return (
    <svg viewBox="0 0 340 500" role="img" aria-labelledby="measure-diagram-title measure-diagram-desc" className="mx-auto h-auto w-full max-w-[320px]">
      <title id="measure-diagram-title">Where to measure</title>
      <desc id="measure-diagram-desc">
        A figure wearing a kurta and straight trousers. Numbered tape lines mark 1 bust, 2 waist and 3 hip around the body, 4 shirt length from shoulder to hem, and 5 trouser length from waist to ankle.
      </desc>

      {/* Arch and floor */}
      <path d="M96 488 V196 C96 124 150 98 180 70 C210 98 264 124 264 196 V488 Z" className="fill-ivory" />
      <path d="M20 488 H330" className="stroke-line-strong [stroke-width:1]" />

      {/* Sleeves sit behind the body */}
      <path d="M128 96 L106 104 L92 240 L110 244 L122 150 Z" className={`fill-blush ${outline}`} />
      <path d="M232 96 L254 104 L268 240 L250 244 L238 150 Z" className={`fill-blush ${outline}`} />
      <circle cx="100" cy="252" r="8" className={`fill-beige ${outline}`} />
      <circle cx="260" cy="252" r="8" className={`fill-beige ${outline}`} />

      {/* Trousers and feet */}
      <path d="M146 328 L142 474 L172 474 L178 328 Z" className={`fill-cream ${outline}`} />
      <path d="M182 328 L188 474 L218 474 L214 328 Z" className={`fill-cream ${outline}`} />
      <path d="M138 474 H174 V480 H138 Z M186 474 H222 V480 H186 Z" className="fill-charcoal" />

      {/* Head, neck and kurta */}
      <rect x="172" y="62" width="16" height="20" className={`fill-beige ${outline}`} />
      <circle cx="180" cy="44" r="22" className={`fill-beige ${outline}`} />
      <path d="M150 84 Q180 78 210 84 L232 96 L228 190 L244 330 L116 330 L132 190 L128 96 Z" className={`fill-blush ${outline}`} />
      <path d="M167 82 L180 110 L193 82" className={`fill-none ${outline}`} />
      <path d="M119 312 H241 M118 320 H242" className="fill-none stroke-rose [stroke-width:1.5]" />

      {/* 1–3: circumferences, numbered on the right */}
      <path d="M129 130 Q180 142 231 130" className={tape} />
      <path d="M233 131 H286" className={guide} />
      <Marker x={298} y={131} n={1} />
      <path d="M132 188 Q180 198 228 188" className={tape} />
      <path d="M230 189 H286" className={guide} />
      <Marker x={298} y={189} n={2} />
      <path d="M123 270 Q180 282 237 270" className={tape} />
      <path d="M239 271 H286" className={guide} />
      <Marker x={298} y={271} n={3} />

      {/* 4: shirt length, shoulder to hem */}
      <path d="M62 84 H150 M62 330 H116" className={guide} />
      <path d="M56 84 V330 M50 84 H62 M50 330 H62" className="fill-none stroke-charcoal [stroke-width:1.2]" />
      <Marker x={56} y={208} n={4} />

      {/* 5: trouser length, waist to ankle */}
      <path d="M86 190 H132 M86 474 H142" className={guide} />
      <path d="M80 190 V474 M74 190 H86 M74 474 H86" className="fill-none stroke-charcoal [stroke-width:1.2]" />
      <Marker x={80} y={402} n={5} />
    </svg>
  );
}

const FIT_ICONS = {
  kurta: (
    <>
      <path d="M15 6 Q20 4.6 25 6 L31 9 L34 22 L30.6 23 L28.6 15.5 L30 34 H10 L11.4 15.5 L9.4 23 L6 22 L9 9 Z" />
      <path d="M17.6 5.8 L20 10.5 L22.4 5.8" />
    </>
  ),
  trouser: (
    <>
      <path d="M12 6 H28 L30 34 H22.6 L20 14.5 L17.4 34 H10 Z" />
      <path d="M12.2 9.6 H27.8" />
    </>
  ),
  dupatta: (
    <>
      <path d="M8 8 C16 12 24 12 32 8 L30 32 C24 29 16 29 10 32 Z" />
      <path d="M9.6 27.6 C16 25 24 25 30.4 27.6" />
    </>
  ),
} as const;

function FitIcon({ kind }: { kind: keyof typeof FIT_ICONS }) {
  return (
    <svg viewBox="0 0 40 40" className="size-10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" aria-hidden>
      {FIT_ICONS[kind]}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SizeGuidePage() {
  return (
    <article className="container-site pb-24 pt-8 md:pt-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: TITLE }]} />
      <header className="mx-auto mt-10 max-w-3xl text-center md:mt-14">
        <p className="eyebrow">Fit &amp; measurements</p>
        <h1 className="heading-page mt-3">{TITLE}</h1>
        <p className="mt-4 text-ink-2 md:text-[17px]">
          Every AURAQ piece is cut on our own pattern blocks in Lahore. Measure yourself once, match it to the chart, and let our fit notes take care of the rest.
        </p>
      </header>

      <nav aria-label="On this page" className="mt-10 md:mt-12">
        <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:justify-center md:px-0">
          {SECTIONS.map((s) => (
            <li key={s.id} className="shrink-0">
              <a href={`#${s.id}`} className="inline-flex h-9 items-center rounded-full border border-line-strong px-4 font-ui text-[13px] transition-colors hover:border-charcoal">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Size chart ---------------------------------------------------------- */}
      <section id="size-chart" aria-labelledby="size-chart-heading" className="mx-auto mt-16 max-w-6xl md:mt-24">
        <SectionHeading id="size-chart-heading" eyebrow="Ready to wear · Luxury pret · Formals" title="Size chart" />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
          <div>
            <h3 className="ui-label mb-2">Body measurements · inches</h3>
            <SizeGuideTable />
            <details className="group mt-8 border-y border-line">
              <summary className="ui-label flex h-14 items-center justify-between gap-4">
                Body measurements · centimetres
                <Plus className="size-4 shrink-0 transition-transform duration-300 group-open:rotate-45" strokeWidth={1.4} aria-hidden />
              </summary>
              <div className="pb-6">
                <DataTable caption="Size guide in centimetres" columns={sizeGuide.columns} rows={cmRows} unit=" cm" />
              </div>
            </details>
          </div>

          <aside className="space-y-5" aria-label="Choosing a size">
            <div className="bg-cream p-6 md:p-8">
              <h3 className="font-display text-[26px] leading-tight">International sizes</h3>
              <p className="mb-4 mt-2 text-[14px] text-ink-2">Approximate equivalents — the body measurements are always the surest guide.</p>
              <DataTable caption="Approximate international size equivalents" columns={internationalSizes.columns} rows={internationalSizes.rows} />
            </div>
            <div className="border border-line p-6 md:p-8">
              <h3 className="font-display text-[26px] leading-tight">Between sizes?</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
                Choose the larger size for kurtas and shirts — the extra ease drapes beautifully. Still unsure?{" "}
                <a href={site.contact.whatsapp} target="_blank" rel="noopener noreferrer" className="text-charcoal underline underline-offset-4">
                  Send us your measurements on WhatsApp
                </a>{" "}
                and a stylist will recommend your size — usually within the hour, {site.contact.hours}.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* How to measure ------------------------------------------------------ */}
      <section id="how-to-measure" aria-labelledby="measure-heading" className="mx-auto mt-20 max-w-6xl md:mt-28">
        <SectionHeading id="measure-heading" eyebrow="Two minutes and a soft tape" title="How to measure" />
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12 lg:gap-20">
          <figure className="bg-cream px-6 pb-6 pt-8 md:sticky md:top-[150px]">
            <MeasureDiagram />
            <figcaption className="mt-4 text-center font-ui text-[12px] tracking-[0.04em] text-ink-2">Measure your body, not a garment. All measurements in inches.</figcaption>
          </figure>
          <div>
            <ol className="divide-y divide-line border-y border-line">
              {howToMeasure.map((m, i) => (
                <li key={m.label} className="grid grid-cols-[32px_1fr] gap-4 py-5 md:gap-5 md:py-6">
                  <span aria-hidden className="grid size-8 place-items-center rounded-full bg-charcoal font-ui text-[12px] font-semibold text-ivory">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-ui text-[15px] font-medium">{m.label}</h3>
                    <p className="mt-1 text-ink-2">{m.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8 bg-blush p-6 md:p-8">
              <h3 className="ui-label">Good to know</h3>
              <ul className="mt-4 space-y-2.5 text-[14px] leading-relaxed text-ink-2">
                {measuringTips.map((t) => (
                  <li key={t} className="flex gap-3">
                    <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-charcoal" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Fit notes ------------------------------------------------------------ */}
      <section id="fit-notes" aria-labelledby="fit-heading" className="mx-auto mt-20 max-w-6xl md:mt-28">
        <SectionHeading id="fit-heading" eyebrow="How our pieces wear" title="Fit notes" />
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 md:gap-5 lg:grid-cols-3 lg:gap-6">
          {fitNotes.map((n) => (
            <li key={n.kind} className="flex flex-col bg-cream p-6 md:p-8">
              <FitIcon kind={n.kind} />
              <h3 className="mt-5 font-display text-[26px] leading-tight md:text-[28px]">{n.title}</h3>
              <p className="mt-1 font-ui text-[12px] uppercase tracking-[0.14em] text-ink-2">{n.summary}</p>
              <ul className="mt-5 space-y-3 border-t border-charcoal/10 pt-5 text-[14px] leading-relaxed text-ink-2">
                {n.points.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-charcoal" />
                    {p}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {/* Unstitched ----------------------------------------------------------- */}
      <section id="unstitched" aria-labelledby="unstitched-heading" className="mx-auto mt-20 max-w-6xl md:mt-28">
        <SectionHeading
          id="unstitched-heading"
          eyebrow="Notes for your tailor"
          title="Unstitched fabric"
          action={
            <Link href="/category/unstitched" className="link-underline ui-label inline-flex items-center gap-2 text-[12px]">
              Shop unstitched {arrow}
            </Link>
          }
        />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <div>
            <p className="max-w-2xl text-ink-2 md:text-[17px]">
              Our unstitched suits arrive as generous cut lengths, so you can stitch them exactly the way you like. Here is what each piece is for.
            </p>
            <table className="mt-6 w-full border-collapse font-ui text-[14px]">
              <caption className="sr-only">Fabric lengths in an AURAQ unstitched suit</caption>
              <thead>
                <tr>
                  <th scope="col" className="border-b border-charcoal py-3 pr-4 text-left text-[12px] font-medium uppercase tracking-[0.12em]">
                    Piece
                  </th>
                  <th scope="col" className="border-b border-charcoal py-3 text-right text-[12px] font-medium uppercase tracking-[0.12em]">
                    Length
                  </th>
                </tr>
              </thead>
              <tbody>
                {unstitchedGuide.pieces.map((p) => (
                  <tr key={p.piece}>
                    <th scope="row" className="border-b border-line py-4 pr-4 text-left align-top font-normal">
                      <span className="block font-medium">{p.piece}</span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-ink-2">{p.note}</span>
                    </th>
                    <td className="whitespace-nowrap border-b border-line py-4 text-right align-top font-display text-[22px] leading-none">{p.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-[13px] text-ink-2">2 piece suits include the shirt and trouser; 3 piece suits add the dupatta.</p>
          </div>

          <div className="bg-sage p-6 md:p-8">
            <h3 className="font-display text-[26px] leading-tight">Before you cut</h3>
            <ol className="mt-5 space-y-4 text-[14px] leading-relaxed text-ink-2">
              {unstitchedGuide.tips.map((t, i) => (
                <li key={t} className="grid grid-cols-[24px_1fr] gap-3">
                  <span aria-hidden className="font-display text-[20px] leading-[1.1] text-charcoal">
                    {i + 1}.
                  </span>
                  {t}
                </li>
              ))}
            </ol>
            <p className="mt-6 border-t border-charcoal/15 pt-5 text-[13px] leading-relaxed text-ink-2">
              {unstitchedGuide.exchangeNote}{" "}
              <Link href="/return-policy" className="text-charcoal underline underline-offset-4">
                Return &amp; exchange policy
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Made to measure ------------------------------------------------------ */}
      <section id="made-to-measure" aria-labelledby="mtm-heading" className="mx-auto mt-20 grid max-w-6xl grid-cols-[minmax(0,1fr)] overflow-hidden bg-powder md:mt-28 md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[560px]">
          <Image src="/images/gallery/edit-2.jpg" alt="Close-up of an ivory kurta with a gold embroidered neckline and dupatta" fill sizes="(min-width: 1200px) 576px, (min-width: 768px) 50vw, 100vw" className="object-cover object-top" />
        </div>
        <div className="flex items-center px-5 py-12 md:px-10 md:py-16 xl:px-16">
          <div className="max-w-[460px]">
            <p className="eyebrow">Atelier service</p>
            <h2 id="mtm-heading" className="heading-page mt-4">
              Made to measure in Lahore
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-ink-2 md:text-[16px]">{customStitching.text}</p>
            <dl className="my-8 grid grid-cols-3 border-y border-charcoal/15">
              {[
                { value: formatPrice(customStitching.stitchingFrom), label: "Stitching from" },
                { value: customStitching.turnaround, label: "Working days" },
                { value: "Free", label: "Fit advice" },
              ].map((f, i) => (
                <div key={f.label} className={i ? "border-l border-charcoal/15 py-5 pl-3 md:pl-5" : "py-5 pr-2"}>
                  <dt className="sr-only">{f.label}</dt>
                  <dd>
                    <span className="block font-display text-[22px] leading-tight md:text-[26px]">{f.value}</span>
                    <span className="font-ui text-[11px] uppercase tracking-[0.12em] text-ink-2">{f.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <a href={site.contact.whatsapp} target="_blank" rel="noopener noreferrer" className={buttonClasses({ className: "max-sm:w-full" })}>
                <MessageCircle className="size-4" strokeWidth={1.4} aria-hidden />
                WhatsApp our atelier
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <Link href="/contact" className="link-underline ui-label text-[12px]">
                Contact us
              </Link>
            </div>
            <p className="mt-6 font-ui text-[13px] leading-relaxed text-ink-2">
              Prefer to talk? Call{" "}
              <a href={site.contact.phoneHref} className="whitespace-nowrap text-charcoal underline underline-offset-4">
                {site.contact.phone}
              </a>{" "}
              or email{" "}
              <a href={`mailto:${site.contact.email}`} className="text-charcoal underline underline-offset-4">
                {site.contact.email}
              </a>
              , {site.contact.hours}.
            </p>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-3">{customStitching.note}</p>
          </div>
        </div>
      </section>

      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: TITLE, path: "/size-guide" }])} />
    </article>
  );
}

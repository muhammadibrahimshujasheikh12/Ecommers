import Image from "next/image";
import { ArrowUpRight, Gem, Mail, MapPin, Phone, Receipt, Ruler, Scissors, ShoppingBag, Sparkles } from "lucide-react";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { appointment, storeServices, type Store, type StoreService } from "@/content/stores";
import { site } from "@/content/site";
import { siteUrl } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";

const SERVICE_ICONS: Record<StoreService, typeof Scissors> = {
  stitching: Scissors,
  alterations: Ruler,
  styling: Sparkles,
  couture: Gem,
  collect: ShoppingBag,
  taxfree: Receipt,
};

/** "14:30" → "2:30pm", "24:00" → "midnight". */
export function formatTime(value: string): string {
  const [h, m] = value.split(":").map(Number);
  if (h === 24 || (h === 0 && m === 0)) return "midnight";
  if (h === 12 && m === 0) return "noon";
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return `${hour}${m ? `:${String(m).padStart(2, "0")}` : ""}${suffix}`;
}

export const mapsUrl = (store: Store) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.mapsQuery)}`;

export function StoreCard({ store }: { store: Store }) {
  const headingId = `${store.id}-name`;
  return (
    <article id={store.id} aria-labelledby={headingId} className="grid scroll-mt-[150px] gap-8 lg:grid-cols-12 lg:items-start lg:gap-12 xl:gap-16">
      <div className="relative aspect-[4/3] overflow-hidden bg-beige lg:col-span-7 lg:group-even:order-last">
        <Image src={store.image.src} alt={store.image.alt} fill sizes="(min-width: 1440px) 760px, (min-width: 1024px) 56vw, 100vw" className="object-cover" />
        {store.flagship && (
          <Badge tone="new" className="absolute left-3 top-3 md:left-4 md:top-4">
            Flagship
          </Badge>
        )}
      </div>

      <div className="lg:col-span-5">
        <p className="eyebrow">
          {store.city}, {store.country}
        </p>
        <h2 id={headingId} className="mt-3 font-display text-[34px] leading-[1.08] md:text-[44px]">
          {store.name}
        </h2>
        <p className="mt-4 max-w-lg text-[15px] leading-[1.75] text-ink-2">{store.description}</p>

        <div className="mt-8 grid gap-6 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div>
            <h3 className="ui-label text-[11px] text-ink-2">Address</h3>
            <address className="mt-3 flex gap-2.5 text-[14px] not-italic leading-relaxed">
              <MapPin className="mt-1 size-4 shrink-0" strokeWidth={1.3} aria-hidden />
              <span>
                {store.address.lines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
                <span className="block">
                  {store.address.locality}
                  {store.address.postalCode ? ` ${store.address.postalCode}` : ""}
                  {store.address.countryCode === "AE" ? ", UAE" : ""}
                </span>
              </span>
            </address>
          </div>
          <div>
            <h3 className="ui-label text-[11px] text-ink-2">Contact</h3>
            <ul className="mt-3 space-y-2 font-ui text-[14px]">
              <li>
                <a href={store.phoneHref} className="inline-flex items-center gap-2.5 hover:underline hover:underline-offset-4">
                  <Phone className="size-4 shrink-0" strokeWidth={1.3} aria-hidden />
                  <span className="sr-only">Call {store.name}: </span>
                  {store.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${store.email}`} className="inline-flex items-center gap-2.5 wrap-anywhere hover:underline hover:underline-offset-4">
                  <Mail className="size-4 shrink-0" strokeWidth={1.3} aria-hidden />
                  <span className="sr-only">Email {store.name}: </span>
                  {store.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <table className="mt-8 w-full text-[14px]">
          <caption className="ui-label mb-2 text-left text-[11px] text-ink-2">Opening hours</caption>
          <tbody>
            {store.hours.map((h) => (
              <tr key={h.label} className="border-b border-line">
                <th scope="row" className="py-2.5 pr-4 text-left align-top font-ui font-medium">
                  {h.label}
                </th>
                <td className="py-2.5 text-right text-ink-2">
                  {h.slots.map(([open, close], i) => (
                    <span key={open} className="block">
                      {formatTime(open)} – {formatTime(close)}
                      {i < h.slots.length - 1 && <span className="sr-only">, then</span>}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {store.hoursNote && <p className="mt-2.5 text-[13px] text-ink-3">{store.hoursNote}</p>}

        <h3 className="ui-label mt-8 text-[11px] text-ink-2">In-store services</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {store.services.map((s) => {
            const Icon = SERVICE_ICONS[s];
            return (
              <li key={s} className="inline-flex h-9 items-center gap-2 rounded-full bg-cream px-4 font-ui text-[13px]">
                <Icon className="size-3.5" strokeWidth={1.4} aria-hidden />
                {storeServices[s].label}
              </li>
            );
          })}
        </ul>

        {/* Wraps: the narrow lg column can't fit both on one line. */}
        <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
          <a href={mapsUrl(store)} target="_blank" rel="noopener noreferrer" className={buttonClasses({ className: "max-sm:w-full" })}>
            Get Directions
            <ArrowUpRight className="size-4" strokeWidth={1.4} aria-hidden />
            <span className="sr-only">to {store.name} (opens Google Maps in a new tab)</span>
          </a>
          <a href={store.phoneHref} className={buttonClasses({ variant: "text", className: "max-sm:mx-auto" })}>
            Call the Boutique<span className="sr-only">: {store.phone}</span>
          </a>
        </div>
      </div>
    </article>
  );
}

/** Explains every in-store service once, below the store list. */
export function ServicesGlossary() {
  const entries = Object.entries(storeServices) as [StoreService, (typeof storeServices)[StoreService]][];
  return (
    <section aria-labelledby="services-heading" className="border-t border-line py-16 md:py-24">
      <div className="reveal">
        <p className="eyebrow mb-3">How We Can Help</p>
        <h2 id="services-heading" className="heading-section">
          In-Store Services
        </h2>
        <ul className="mt-10 grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
          {entries.map(([key, s]) => {
            const Icon = SERVICE_ICONS[key];
            return (
              <li key={key} className="flex gap-4">
                <Icon className="mt-1 size-6 shrink-0" strokeWidth={1.1} aria-hidden />
                <div>
                  <h3 className="font-ui text-[13px] font-medium uppercase tracking-[0.14em]">{s.label}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{s.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function AppointmentBand() {
  const a = appointment;
  return (
    <section aria-labelledby="appointment-heading" className="bg-blush py-16 md:py-24">
      <div className="container-site reveal grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <p className="eyebrow">{a.eyebrow}</p>
          <h2 id="appointment-heading" className="heading-page mt-4">
            {a.title}
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-[1.8] text-ink-2 md:text-[16px]">{a.text}</p>
          <ButtonLink href="/contact" className="mt-8 max-md:w-full">
            Request an Appointment
          </ButtonLink>
        </div>
        <div className="border-t border-charcoal/15 pt-10 lg:col-span-5 lg:col-start-8 lg:border-l lg:border-t-0 lg:pl-14 lg:pt-0">
          <h3 className="font-display text-[28px] leading-tight md:text-[32px]">{a.virtualTitle}</h3>
          <p className="mt-3 text-[15px] leading-[1.8] text-ink-2">{a.virtualText}</p>
          <a href={site.contact.whatsapp} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "secondary", className: "mt-7 max-md:w-full" })}>
            Message Us on WhatsApp
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <p className="mt-6 text-[13px] text-ink-2">
            Or call customer care on{" "}
            <a href={site.contact.phoneHref} className="text-charcoal underline underline-offset-[3px]">
              {site.contact.phone}
            </a>
            , {site.contact.hours}.
          </p>
        </div>
      </div>
    </section>
  );
}

/** schema.org ClothingStore entries, linked to the brand Organization. */
export function storesJsonLd(stores: Store[]) {
  return stores.map((s) => ({
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "@id": `${siteUrl}/stores#${s.id}`,
    name: `${site.name} ${s.name}`,
    description: s.description,
    url: absoluteUrl(`/stores#${s.id}`),
    image: absoluteUrl(s.image.src),
    telephone: s.phone,
    email: s.email,
    priceRange: "$$$",
    currenciesAccepted: s.address.countryCode === "AE" ? "AED" : "PKR",
    hasMap: mapsUrl(s),
    address: {
      "@type": "PostalAddress",
      streetAddress: s.address.lines.join(", "),
      addressLocality: s.address.locality,
      addressRegion: s.address.region,
      postalCode: s.address.postalCode,
      addressCountry: s.address.countryCode,
    },
    openingHoursSpecification: s.hours.flatMap((h) =>
      h.slots.map(([opens, closes]) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.days.map((d) => `https://schema.org/${d}`),
        opens,
        closes: closes === "24:00" ? "23:59" : closes,
      })),
    ),
    parentOrganization: { "@id": `${siteUrl}/#organization` },
  }));
}

import Link from "next/link";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { SizeGuideTable } from "./purchase-panel";
import { site } from "@/content/site";
import { formatPrice } from "@/utils/format";
import type { ProductDetail } from "@/types/domain";

function Section({ title, children, open }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-line">
      <summary className="flex min-h-16 cursor-pointer items-center justify-between font-ui text-[13px] font-medium uppercase tracking-[0.16em]">
        {title}
        <Plus className="size-4 transition-transform duration-300 group-open:rotate-45" strokeWidth={1.4} aria-hidden />
      </summary>
      <div className="pb-7 text-[15px] leading-relaxed text-ink-2">{children}</div>
    </details>
  );
}

/** Description, details, material, care, size guide, shipping & returns. */
export function ProductInfo({ product }: { product: ProductDetail }) {
  return (
    <div className="border-t border-line">
      <Section title="Description" open>
        <div className="space-y-4">
          {(product.description ?? "").split(/\n{2,}/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </Section>
      <Section title="Product Details">
        <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2.5 font-ui text-[14px]">
          {product.details.map((d) => (
            <div key={d.label} className="contents">
              <dt className="text-ink-3">{d.label}</dt>
              <dd className="text-charcoal">{d.value}</dd>
            </div>
          ))}
          <dt className="text-ink-3">SKU</dt>
          <dd className="text-charcoal">{product.sku}</dd>
          {product.collections.length > 0 && (
            <>
              <dt className="text-ink-3">Collection</dt>
              <dd>
                {product.collections.map((c, i) => (
                  <span key={c.slug}>
                    {i > 0 && ", "}
                    <Link href={`/collections/${c.slug}`} className="text-charcoal underline underline-offset-[3px]">
                      {c.name}
                    </Link>
                  </span>
                ))}
              </dd>
            </>
          )}
        </dl>
      </Section>
      {product.material && <Section title="Material">{product.material}</Section>}
      {product.careInstructions && <Section title="Care Instructions">{product.careInstructions}</Section>}
      {product.sizes.some((s) => s !== "One Size") && (
        <Section title="Size Guide">
          <SizeGuideTable />
        </Section>
      )}
      <Section title="Shipping Information">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Orders are processed within 1–2 working days.</li>
          <li>Standard delivery in Pakistan: 3–5 working days — complimentary over {formatPrice(site.freeShippingThreshold)}.</li>
          <li>Express delivery to Lahore, Karachi and Islamabad: 1–2 working days.</li>
          <li>International shipping to the UAE, KSA, Qatar, UK, USA, Canada and Australia in 7–12 working days.</li>
        </ul>
        <Link href="/shipping-policy" className="mt-3 inline-block text-charcoal underline underline-offset-[3px]">
          Read our shipping policy
        </Link>
      </Section>
      <Section title="Return Information">
        <p>Exchanges are accepted within 14 days of delivery for unworn items with tags attached. Unstitched fabric can be exchanged within 7 days if uncut. Sale items are final.</p>
        <Link href="/return-policy" className="mt-3 inline-block text-charcoal underline underline-offset-[3px]">
          Read our return &amp; exchange policy
        </Link>
      </Section>
    </div>
  );
}

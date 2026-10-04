import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { parseMarkdown, type Inline } from "@/utils/markdown";

/** Renders schema.org JSON-LD safely (escapes "<" to prevent script break-out). */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // JSON is serialised and "<" escaped, so it cannot break out of the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

function renderInline(parts: Inline[]): ReactNode {
  return parts.map((p, i) => {
    if (p.type === "strong") return <strong key={i}>{p.value}</strong>;
    if (p.type === "link") {
      return p.href.startsWith("/") ? (
        <Link key={i} href={p.href}>
          {p.value}
        </Link>
      ) : (
        <a key={i} href={p.href} rel="noopener noreferrer">
          {p.value}
        </a>
      );
    }
    const lines = p.value.split("\n");
    return (
      <Fragment key={i}>
        {lines.map((l, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {l}
          </Fragment>
        ))}
      </Fragment>
    );
  });
}

/** Safe Markdown renderer for CMS pages. */
export function Markdown({ source }: { source: string }) {
  const blocks = parseMarkdown(source);
  return (
    <div className="prose-auraq">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "heading":
            return b.level === 2 ? (
              <h2 key={i} id={b.id}>
                {b.text}
              </h2>
            ) : (
              <h3 key={i} id={b.id}>
                {b.text}
              </h3>
            );
          case "paragraph":
            return <p key={i}>{renderInline(b.content)}</p>;
          case "list": {
            const Tag = b.ordered ? "ol" : "ul";
            return (
              <Tag key={i}>
                {b.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </Tag>
            );
          }
          case "table":
            return (
              <div key={i} className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      {b.head.map((c, j) => (
                        <th key={j} scope="col">
                          {renderInline(c)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, j) => (
                      <tr key={j}>
                        {row.map((c, k) => (
                          <td key={k}>{renderInline(c)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}

export function Logo({ className, small }: { className?: string; small?: boolean }) {
  return (
    <span className={className}>
      <span className={small ? "block font-display text-[24px] leading-none tracking-[0.3em]" : "block font-display text-[26px] leading-none tracking-[0.32em] md:text-[36px]"}>
        AURAQ
      </span>
      {!small && <span className="mt-1.5 hidden font-ui text-[10px] uppercase tracking-[0.5em] text-ink-2 md:block">Lahore</span>}
    </span>
  );
}

const SOCIAL_PATHS = {
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17" cy="7" r=".6" fill="currentColor" />
    </>
  ),
  facebook: <path d="M13.5 20v-7h2.4l.4-2.8h-2.8V8.5c0-.8.3-1.4 1.4-1.4h1.5V4.6c-.3 0-1.2-.1-2.2-.1-2.2 0-3.6 1.3-3.6 3.7v2h-2.4V13h2.4v7" />,
  tiktok: <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.4 2.3 1.9 3.8 4.5 4" />,
  pinterest: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M11 9.5c0-1.5 1.2-2.4 2.6-2.4 1.6 0 2.7 1.1 2.7 2.7 0 2-1.1 3.6-2.7 3.6-.9 0-1.5-.6-1.3-1.4M11.6 12L10 19.5" />
    </>
  ),
} as const;

export function SocialIcon({ name, className = "size-[18px]" }: { name: keyof typeof SOCIAL_PATHS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {SOCIAL_PATHS[name]}
    </svg>
  );
}

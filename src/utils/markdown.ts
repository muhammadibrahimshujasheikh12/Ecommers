/*
 * Minimal, safe Markdown parser for CMS-style pages (policies, FAQs).
 * Produces a block tree that is rendered with React — no HTML injection.
 * Supports: ## / ### headings, paragraphs, - lists, 1. lists, | tables |,
 * **bold** and [links](url).
 */

export type Inline = { type: "text"; value: string } | { type: "strong"; value: string } | { type: "link"; value: string; href: string };

export type Block =
  | { type: "heading"; level: 2 | 3; id: string; text: string }
  | { type: "paragraph"; content: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "table"; head: Inline[][]; rows: Inline[][][] };

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/|#)/i;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ type: "text", value: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ type: "strong", value: m[1] });
    else if (SAFE_HREF.test(m[3])) out.push({ type: "link", value: m[2], href: m[3] });
    else out.push({ type: "text", value: m[2] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) });
  return out;
}

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => parseInline(c.trim()));

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  const used = new Map<string, number>();
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      const text = heading[2].trim();
      const base = slugify(text) || "section";
      const n = used.get(base) ?? 0;
      used.set(base, n + 1);
      blocks.push({ type: "heading", level: heading[1].length as 2 | 3, id: n ? `${base}-${n}` : base, text });
      i++;
      continue;
    }

    if (/^\s*\|/.test(line)) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) tableLines.push(lines[i++]);
      const [head, , ...rows] = tableLines;
      blocks.push({ type: "table", head: cells(head), rows: rows.map(cells) });
      continue;
    }

    const listMatch = /^\s*(-|\d+\.)\s+/.exec(line);
    if (listMatch) {
      const ordered = listMatch[1] !== "-";
      const items: Inline[][] = [];
      while (i < lines.length && /^\s*(-|\d+\.)\s+/.test(lines[i])) {
        items.push(parseInline(lines[i].replace(/^\s*(-|\d+\.)\s+/, "")));
        i++;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|\s*\||\s*(-|\d+\.)\s)/.test(lines[i])) {
      para.push(lines[i].trim());
      i++;
    }
    // Lines inside a paragraph are joined with a line break marker.
    blocks.push({ type: "paragraph", content: parseInline(para.join("\n")) });
  }
  return blocks;
}

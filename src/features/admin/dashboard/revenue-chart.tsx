"use client";

import { useEffect, useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatDayLong, formatDayShort } from "@/features/admin/orders/time";
import { formatPrice, pluralize } from "@/utils/format";

/*
 * Revenue per day as columns (one series, so no legend: the panel title names
 * it). Inline SVG sized to its container; hover or arrow keys read a day;
 * "Show as table" carries every value without the chart.
 *
 * Marks follow the dataviz spec: columns ≤ 24px with a 4px rounded data end
 * and a square base, a 2px gap between neighbours, hairline solid gridlines,
 * clean tick values. The column colour (#bf6a4f, clay) passes the palette
 * validator against the panel surface (lightness band, chroma ≥ 0.10, ≥ 3:1).
 */

export type ChartDay = { day: string; revenue: number; orders: number };

const HEIGHT = 248;
const M = { top: 14, right: 6, bottom: 30, left: 58 };
const MAX_BAR = 24;
const GAP = 2;

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const axisMoney = (n: number) => (n === 0 ? "0" : `Rs ${compact.format(n)}`);

function niceStep(max: number, count: number) {
  const raw = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / magnitude;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return step * magnitude;
}

/** Column with a rounded top (data end) and a square base on the baseline. */
function columnPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function RevenueChart({ days, rangeLabel }: { days: ChartDay[]; rangeLabel: string }) {
  // A callback ref: the plot box only exists when there is data to draw.
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const descId = useId();

  useEffect(() => {
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(box);
    return () => observer.disconnect();
  }, [box]);

  const n = days.length;
  const total = days.reduce((s, d) => s + d.revenue, 0);
  const maxRevenue = Math.max(0, ...days.map((d) => d.revenue));
  const step = maxRevenue > 0 ? niceStep(maxRevenue, 4) : 1;
  const top = maxRevenue > 0 ? Math.ceil(maxRevenue / step) * step : 1;
  const ticks = maxRevenue > 0 ? Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) : [];

  const plotW = Math.max(0, (width ?? 0) - M.left - M.right);
  const plotH = HEIGHT - M.top - M.bottom;
  const slot = n ? plotW / n : 0;
  const barW = Math.max(1, Math.min(MAX_BAR, slot - GAP));
  const y = (v: number) => M.top + plotH - (v / top) * plotH;
  const cx = (i: number) => M.left + i * slot + slot / 2;

  // Label about one day per 64px, always including the last (today).
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / 64))));
  const labelled = days.map((_, i) => (n - 1 - i) % labelEvery === 0);

  const describe = (d: ChartDay) => `${formatDayLong(d.day)}: ${formatPrice(d.revenue)} from ${pluralize(d.orders, "order")}`;
  const current = active !== null ? days[active] : null;

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!slot) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.floor((e.clientX - rect.left - M.left) / slot);
    setActive(i >= 0 && i < n ? i : null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!n) return;
    const from = active ?? n - 1;
    const next =
      e.key === "ArrowLeft" ? Math.max(0, from - 1)
      : e.key === "ArrowRight" ? Math.min(n - 1, from + 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? n - 1
      : null;
    if (e.key === "Escape") setActive(null);
    if (next === null) return;
    e.preventDefault();
    setActive(next);
  };

  if (!n || maxRevenue === 0) {
    return (
      <div className="grid h-[248px] place-items-center rounded-[3px] border border-dashed border-line-strong/70 bg-ivory/60 px-6 text-center">
        <div>
          <p className="font-ui text-[14px] font-medium">No revenue in the {rangeLabel.toLowerCase()}</p>
          <p className="mt-1 text-[13px] text-ink-3">Days with sales will appear here as columns.</p>
        </div>
      </div>
    );
  }

  const tooltipLeft = active !== null ? cx(active) : 0;
  const flip = width !== null && tooltipLeft > width - 170;

  return (
    <div>
      <div
        ref={setBox}
        tabIndex={0}
        role="group"
        aria-label={`Revenue by day, ${rangeLabel.toLowerCase()}. Total ${formatPrice(total)}.`}
        aria-describedby={descId}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((a) => a ?? n - 1)}
        onBlur={() => setActive(null)}
        className="relative h-[248px] rounded-[2px] outline-offset-4 [--viz-axis:#cfc4b5] [--viz-bar-active:#9a4f37] [--viz-bar:#bf6a4f] [--viz-grid:#ece4d8]"
      >
        <p id={descId} className="sr-only">
          Use the left and right arrow keys to read each day; Home and End jump to the first and last day.
        </p>
        {width !== null && (
          <svg
            width={width}
            height={HEIGHT}
            aria-hidden
            className="block animate-fade-in touch-pan-y select-none"
            onPointerMove={onPointerMove}
            onPointerDown={onPointerMove}
            onPointerLeave={() => setActive(null)}
          >
            {/* Gridlines and y ticks */}
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={M.left}
                  x2={M.left + plotW}
                  y1={Math.round(y(t)) + 0.5}
                  y2={Math.round(y(t)) + 0.5}
                  stroke={t === 0 ? "var(--viz-axis)" : "var(--viz-grid)"}
                  strokeWidth={1}
                />
                <text x={M.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-3 font-ui text-[11px] tabular-nums">
                  {axisMoney(t)}
                </text>
              </g>
            ))}

            {/* Columns */}
            {days.map((d, i) => {
              if (d.revenue <= 0) return null;
              const h = Math.max(1, (d.revenue / top) * plotH);
              return (
                <path
                  key={d.day}
                  d={columnPath(cx(i) - barW / 2, M.top + plotH - h, barW, h)}
                  fill={active === i ? "var(--viz-bar-active)" : "var(--viz-bar)"}
                />
              );
            })}

            {/* Active day marker for zero days, so hover always lands somewhere */}
            {current && current.revenue === 0 && active !== null && (
              <line x1={cx(active)} x2={cx(active)} y1={M.top} y2={M.top + plotH} stroke="var(--viz-axis)" strokeWidth={1} />
            )}

            {/* X labels */}
            {days.map((d, i) => {
              if (!labelled[i]) return null;
              const x = cx(i);
              const anchor = x < M.left + 24 ? "start" : x > M.left + plotW - 24 ? "end" : "middle";
              return (
                <text key={d.day} x={x} y={HEIGHT - 9} textAnchor={anchor} className="fill-ink-3 font-ui text-[11px] tabular-nums">
                  {formatDayShort(d.day)}
                </text>
              );
            })}
          </svg>
        )}

        {current && active !== null && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-1 z-10 min-w-[150px] rounded-[3px] border border-line bg-white px-3 py-2.5 shadow-[var(--shadow-soft)]"
            style={flip ? { right: Math.max(0, (width ?? 0) - tooltipLeft + 10) } : { left: tooltipLeft + 10 }}
          >
            <p className="font-ui text-[15px] font-semibold leading-tight">{formatPrice(current.revenue)}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-2">
              <span aria-hidden className="inline-block h-0.5 w-3 rounded-full bg-[var(--viz-bar)]" />
              {pluralize(current.orders, "order")}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-3">{formatDayLong(current.day)}</p>
          </div>
        )}
        <p aria-live="polite" className="sr-only">
          {current ? describe(current) : ""}
        </p>
      </div>

      <details className="group mt-4">
        <summary className="inline-flex min-h-10 cursor-pointer items-center font-ui text-[13px] text-ink-2 underline underline-offset-4 hover:text-charcoal">
          <span className="group-open:hidden">Show as table</span>
          <span className="hidden group-open:inline">Hide table</span>
        </summary>
        <div className="mt-3 max-h-72 overflow-auto rounded-[3px] border border-line" tabIndex={0} role="region" aria-label="Revenue by day table">
          <table className="w-full border-collapse text-left text-[13px]">
            <caption className="sr-only">Revenue and orders per day, {rangeLabel.toLowerCase()}</caption>
            <thead className="sticky top-0 bg-cream">
              <tr>
                <th scope="col" className="px-4 py-2 font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3">
                  Day
                </th>
                <th scope="col" className="px-4 py-2 text-right font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3">
                  Orders
                </th>
                <th scope="col" className="px-4 py-2 text-right font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((d) => (
                <tr key={d.day} className="border-t border-line">
                  <th scope="row" className="px-4 py-2 font-normal">
                    {formatDayLong(d.day)}
                  </th>
                  <td className="px-4 py-2 text-right tabular-nums">{d.orders}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatPrice(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

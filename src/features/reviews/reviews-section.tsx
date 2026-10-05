import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MessageSquareText } from "lucide-react";
import { getMyReview, getProductReviews, REVIEWS_PAGE_SIZE, type ReviewSort } from "@/lib/data/reviews";
import { getCurrentUser } from "@/lib/supabase/server";
import { reviewImagesEnabled } from "@/lib/env";
import { DEMO_MODE } from "@/lib/demo/mode";
import { DEMO_REVIEW_MAX_LENGTH } from "@/lib/demo/reviews";
import { Stars } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { ReviewForm } from "./review-form";
import type { Review, ReviewSummary } from "@/types/domain";
import { formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";

function ReviewItem({ review }: { review: Review }) {
  return (
    <li className="border-b border-line py-8 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Stars value={review.rating} />
        <time dateTime={review.createdAt} className="font-ui text-[13px] text-ink-3">
          {formatDate(review.createdAt)}
        </time>
      </div>
      <h3 className="mt-3 font-display text-[22px] leading-snug">{review.title}</h3>
      <p className="mt-2 whitespace-pre-line text-ink-2">{review.content}</p>
      {review.images.length > 0 && (
        <ul className="mt-4 flex gap-2">
          {review.images.map((src) => (
            <li key={src} className="relative size-20 overflow-hidden bg-beige">
              <Image src={src} alt={`Photo from ${review.authorName}`} fill sizes="80px" className="object-cover" />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-ui text-[13px]">
        <span className="font-medium">{review.authorName}</span>
        {review.verifiedPurchase && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.12em] text-success">
            <BadgeCheck className="size-3.5" strokeWidth={1.6} /> Verified buyer
          </span>
        )}
        {review.status !== "approved" && (
          // Nobody moderates demo reviews, so there they simply stay pending (see the note under the form).
          <span className="text-[12px] text-warning">{DEMO_MODE ? "Pending" : "Awaiting moderation"} — only you can see this</span>
        )}
      </p>
    </li>
  );
}

/** Ratings summary, distribution, review list (sortable, paginated) and the write/edit form. */
export async function ReviewsSection({
  productId,
  productSlug,
  summary,
  page,
  sort,
}: {
  productId: string;
  productSlug: string;
  summary: ReviewSummary;
  page: number;
  sort: ReviewSort;
}) {
  const [{ reviews, total }, user] = await Promise.all([getProductReviews(productId, { page, sort }), getCurrentUser()]);
  const mine = user ? await getMyReview(productId) : null;
  const pageCount = Math.max(1, Math.ceil(total / REVIEWS_PAGE_SIZE));
  const base = `/product/${productSlug}`;
  const href = (p: number, s: ReviewSort) => {
    const q = new URLSearchParams();
    if (p > 1) q.set("reviews_page", String(p));
    if (s !== "recent") q.set("reviews_sort", s);
    const qs = q.toString();
    return `${base}${qs ? `?${qs}` : ""}#reviews`;
  };
  // Show the user's own pending review on top of the list.
  const list = mine && mine.status !== "approved" ? [mine, ...reviews] : reviews;

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-36 border-t border-line py-16 md:py-24">
      <div className="grid gap-12 lg:grid-cols-[360px_1fr] lg:gap-20">
        <div>
          <h2 id="reviews-heading" className="heading-section">
            Reviews
          </h2>
          {summary.count > 0 ? (
            <>
              <div className="mt-6 flex items-center gap-4">
                <span className="font-display text-[56px] leading-none">{summary.average.toFixed(1)}</span>
                <div>
                  <Stars value={summary.average} size={16} />
                  <p className="mt-1 text-[14px] text-ink-2">
                    {summary.count} {summary.count === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
              <dl className="mt-6 space-y-2">
                {([5, 4, 3, 2, 1] as const).map((r) => {
                  const n = summary.distribution[r];
                  const pct = summary.count ? Math.round((n / summary.count) * 100) : 0;
                  return (
                    <div key={r} className="grid grid-cols-[52px_1fr_36px] items-center gap-3 font-ui text-[13px]">
                      <dt>{r} {r === 1 ? "star" : "stars"}</dt>
                      <dd className="h-1.5 bg-beige">
                        <span className="sr-only">{pct}% of reviews</span>
                        <div aria-hidden className="h-full bg-charcoal" style={{ width: `${pct}%` }} />
                      </dd>
                      <dd className="text-right text-ink-3">{n}</dd>
                    </div>
                  );
                })}
              </dl>
            </>
          ) : (
            <p className="mt-6 text-ink-2">No reviews yet. Be the first to share your thoughts.</p>
          )}

          <div className="mt-10 border-t border-line pt-8">
            <h3 className="font-ui text-[13px] font-medium uppercase tracking-[0.16em]">{mine ? "Your review" : "Write a review"}</h3>
            {user ? (
              <div className="mt-5">
                {mine && <p className="mb-4 text-[14px] text-ink-2">You’ve reviewed this product — editing will update your existing review.</p>}
                <ReviewForm
                  productId={productId}
                  existing={mine}
                  imagesEnabled={reviewImagesEnabled}
                  demo={DEMO_MODE}
                  contentMaxLength={DEMO_MODE ? DEMO_REVIEW_MAX_LENGTH : undefined}
                />
                {DEMO_MODE && (
                  <p className="mt-4 text-[13px] text-ink-3">
                    Demo store — reviews are saved in this browser only, and there’s no moderation team. A review saved after you’ve ordered this piece goes live as a verified review; any other review stays pending, visible only to you.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-[14px] text-ink-2">Sign in to share your experience. Reviews from customers who bought this piece are marked as verified.</p>
                <ButtonLink href={`/login?next=${encodeURIComponent(`${base}#reviews`)}`} variant="secondary" className="mt-5">
                  Sign in to review
                </ButtonLink>
              </div>
            )}
          </div>
        </div>

        <div>
          {list.length ? (
            <>
              <div className="mb-8 flex flex-wrap items-center gap-2 font-ui text-[13px]" role="group" aria-label="Sort reviews">
                <span className="mr-1 text-ink-3">Sort by</span>
                {(
                  [
                    ["recent", "Most recent"],
                    ["highest", "Highest rated"],
                    ["lowest", "Lowest rated"],
                  ] as const
                ).map(([value, label]) => (
                  <Link key={value} href={href(1, value)} scroll={false} aria-current={sort === value ? "true" : undefined} className={cn("rounded-full border px-4 py-1.5", sort === value ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong hover:border-charcoal")}>
                    {label}
                  </Link>
                ))}
              </div>
              <ul>
                {list.map((r) => (
                  <ReviewItem key={r.id} review={r} />
                ))}
              </ul>
              {pageCount > 1 && (
                <nav aria-label="Review pages" className="mt-8 flex items-center gap-4 font-ui text-[13px]">
                  {page > 1 && (
                    <Link href={href(page - 1, sort)} scroll={false} className="underline underline-offset-4">
                      Previous
                    </Link>
                  )}
                  <span className="text-ink-3">
                    Page {page} of {pageCount}
                  </span>
                  {page < pageCount && (
                    <Link href={href(page + 1, sort)} scroll={false} className="underline underline-offset-4">
                      More reviews
                    </Link>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center bg-cream px-6 py-16 text-center">
              <MessageSquareText className="size-8" strokeWidth={1.1} />
              <p className="mt-4 font-display text-[26px]">No reviews yet</p>
              <p className="mt-2 max-w-sm text-ink-2">Own this piece? Your review helps others choose with confidence.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

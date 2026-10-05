"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { ImagePlus, Star } from "lucide-react";
import type { z } from "zod";
import { reviewSchema, REVIEW_IMAGE_LIMIT, REVIEW_IMAGE_MAX_BYTES, REVIEW_IMAGE_TYPES } from "@/lib/validation/schemas";
import { Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { deleteReviewAction, submitReviewAction } from "./actions";
import type { Review } from "@/types/domain";
import { cn } from "@/utils/cn";

type Values = z.input<typeof reviewSchema>;
const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

function StarInput({ value, onChange, error }: { value: number; onChange: (n: number) => void; error?: string }) {
  const [hover, setHover] = useState(0);
  const name = useId();
  const shown = hover || value;
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="font-ui text-[13px] font-medium">
        Your rating <span className="text-ink-3">*</span>
      </legend>
      <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer p-1" onMouseEnter={() => setHover(n)}>
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="peer sr-only" />
            <Star className={cn("size-7 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-focus", n <= shown ? "fill-charcoal stroke-charcoal" : "stroke-ink-3")} strokeWidth={1.2} />
            <span className="sr-only">
              {n} star{n > 1 ? "s" : ""} — {LABELS[n]}
            </span>
          </label>
        ))}
        <span className="ml-2 font-ui text-[13px] text-ink-2" aria-hidden>
          {LABELS[shown]}
        </span>
      </div>
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-1 text-[13px] text-sale">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Shown after saving a review that isn't published yet. */
function pendingMessage(updated: boolean, demo: boolean) {
  if (!demo) return "Thank you! Your review will appear once it has been checked by our team.";
  // Nobody moderates demo reviews: only a review saved after a demo order for the piece is published.
  return `${updated ? "Your review has been updated." : "Thank you! Your review is saved."} It stays pending and only you can see it — order this piece in the demo, then update your review, to post it as verified.`;
}

export function ReviewForm({
  productId,
  existing,
  imagesEnabled,
  demo = false,
  contentMaxLength = 2000,
}: {
  productId: string;
  existing: Review | null;
  imagesEnabled: boolean;
  demo?: boolean;
  contentMaxLength?: number;
}) {
  const router = useRouter();
  const [deleting, startDelete] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { productId, rating: existing?.rating ?? 0, title: existing?.title ?? "", content: existing?.content ?? "" },
  });

  const rating = useWatch({ control, name: "rating" });

  const onFiles = (list: FileList | null) => {
    setFileError(null);
    const picked = Array.from(list ?? []);
    if (picked.length > REVIEW_IMAGE_LIMIT) return setFileError(`Choose up to ${REVIEW_IMAGE_LIMIT} photos.`);
    for (const f of picked) {
      if (!(REVIEW_IMAGE_TYPES as readonly string[]).includes(f.type)) return setFileError("Photos must be JPG, PNG or WebP.");
      if (f.size > REVIEW_IMAGE_MAX_BYTES) return setFileError("Each photo must be 5 MB or smaller.");
    }
    setFiles(picked);
  };

  const onSubmit = handleSubmit(async (values) => {
    setResult(null);
    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("rating", String(values.rating));
    fd.set("title", values.title);
    fd.set("content", values.content);
    for (const f of files) fd.append("images", f);
    const res = await submitReviewAction(fd);
    if (!res.ok) {
      for (const [k, msgs] of Object.entries(res.fieldErrors ?? {})) {
        if (msgs?.[0]) setError(k as keyof Values, { message: msgs[0] });
      }
      setResult({ tone: "error", message: res.error });
      return;
    }
    setResult({
      tone: "success",
      message:
        res.data.status === "approved"
          ? res.data.updated
            ? "Your review has been updated."
            : "Thank you! Your review is now live."
          : pendingMessage(res.data.updated, demo),
    });
    setFiles([]);
    router.refresh();
  });

  const onDelete = () => {
    if (!existing || !window.confirm("Delete your review? This can’t be undone.")) return;
    startDelete(async () => {
      setResult(null);
      const res = await deleteReviewAction(existing.id, productId);
      if (!res.ok) return setResult({ tone: "error", message: res.error });
      reset({ productId, rating: 0, title: "", content: "" });
      setFiles([]);
      setResult({ tone: "success", message: res.message ?? "Review deleted." });
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <StarInput value={Number(rating)} onChange={(n) => setValue("rating", n, { shouldValidate: true })} error={errors.rating?.message} />
      <Input label="Review title" required maxLength={120} error={errors.title?.message} {...register("title")} />
      <Textarea
        label="Your review"
        required
        rows={5}
        maxLength={contentMaxLength}
        hint={`Tell others about fit, fabric and how you styled it.${demo ? ` Up to ${contentMaxLength} characters in the demo store.` : ""}`}
        error={errors.content?.message}
        {...register("content")}
      />
      {imagesEnabled && (
        <div>
          <input ref={fileRef} type="file" accept={REVIEW_IMAGE_TYPES.join(",")} multiple className="sr-only" id="review-images" onChange={(e) => onFiles(e.target.files)} />
          <label htmlFor="review-images" className="inline-flex h-11 cursor-pointer items-center gap-2 border border-dashed border-line-strong px-4 font-ui text-[13px] hover:border-charcoal">
            <ImagePlus className="size-4" strokeWidth={1.3} /> Add photos (optional, up to {REVIEW_IMAGE_LIMIT})
          </label>
          {files.length > 0 && <p className="mt-2 text-[13px] text-ink-2">{files.map((f) => f.name).join(", ")}</p>}
          {fileError && (
            <p role="alert" className="mt-2 text-[13px] text-sale">
              {fileError}
            </p>
          )}
        </div>
      )}
      {result && <Alert tone={result.tone}>{result.message}</Alert>}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button type="submit" loading={isSubmitting} disabled={deleting}>
          {existing ? "Update review" : "Submit review"}
        </Button>
        {existing && (
          <button type="button" onClick={onDelete} disabled={deleting || isSubmitting} className="font-ui text-[13px] text-sale underline underline-offset-4 disabled:opacity-60">
            {deleting ? "Deleting…" : "Delete review"}
          </button>
        )}
      </div>
    </form>
  );
}

"use client";

import { useRef, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { ArrowLeft, ArrowRight, ImagePlus, Images, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { discardProductUploadAction, uploadProductImageAction } from "./actions";
import { CellError, cellInputClasses } from "./form-bits";
import { ImagePicker, libraryLabel } from "./image-picker";
import { IMAGE_UPLOAD, PRODUCT_LIMITS } from "./model";
import type { ProductFormInput, ProductFormOutput } from "./schema";
import { ProductThumb } from "./thumb";

/**
 * Product photos: order (the first is the main image), alt text, removal,
 * and adding from the bundled library or (with Supabase) by uploading to
 * Storage. Uploads made here but removed before saving are deleted again.
 */
export function ImagesEditor({ library, uploadsEnabled }: { library: string[]; uploadsEnabled: boolean }) {
  const toast = useToast();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ProductFormInput, unknown, ProductFormOutput>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "images", keyName: "key" });
  const images = useWatch({ control, name: "images" }) ?? [];
  const productName = useWatch({ control, name: "name" }) ?? "";

  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  /** Uploaded in this session and not saved yet. */
  const fresh = useRef(new Set<string>());

  const room = PRODUCT_LIMITS.images - fields.length;

  async function upload(files: File[]) {
    const queue = files.slice(0, room);
    if (files.length > room) toast({ tone: "error", message: `Only ${room} more ${room === 1 ? "image fits" : "images fit"} — a product can have ${PRODUCT_LIMITS.images}.` });
    let added = 0;
    for (const [i, file] of queue.entries()) {
      if (!(IMAGE_UPLOAD.types as readonly string[]).includes(file.type)) {
        toast({ tone: "error", message: `${file.name}: upload a JPEG, PNG, WebP or AVIF image.` });
        continue;
      }
      if (file.size > IMAGE_UPLOAD.maxBytes) {
        toast({ tone: "error", message: `${file.name} is larger than 10 MB.` });
        continue;
      }
      setUploading({ done: i, total: queue.length });
      const data = new FormData();
      data.set("file", file);
      const res = await uploadProductImageAction(data);
      if (res.ok) {
        fresh.current.add(res.data.url);
        append({ id: "", url: res.data.url, alt: "" }, { shouldFocus: false });
        added++;
      } else {
        toast({ tone: "error", message: `${file.name}: ${res.error}` });
      }
    }
    setUploading(null);
    if (added) setNotice(`Uploaded ${added} ${added === 1 ? "image" : "images"}. Save the product to keep ${added === 1 ? "it" : "them"}.`);
  }

  function removeAt(i: number) {
    const url = images[i]?.url;
    remove(i);
    setNotice(`Removed image ${i + 1}.`);
    if (url && fresh.current.has(url)) {
      fresh.current.delete(url);
      void discardProductUploadAction(url);
    }
  }

  function moveTo(from: number, to: number) {
    move(from, to);
    setNotice(`Moved image ${from + 1} to position ${to + 1}${to === 0 ? " (main image)" : ""}.`);
  }

  return (
    <div>
      {fields.length === 0 ? (
        <div className="grid place-items-center rounded-[3px] border border-dashed border-line-strong bg-ivory/60 px-6 py-12 text-center">
          <Images aria-hidden className="size-7 text-ink-3" strokeWidth={1.3} />
          <p className="mt-3 text-[14px] text-ink-2">No images yet. Add at least one — the first image is shown in listings.</p>
        </div>
      ) : (
        <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {fields.map((field, i) => {
            const url = images[i]?.url ?? "";
            const err = errors.images?.[i];
            const name = url.startsWith("/images/") ? libraryLabel(url) : `Image ${i + 1}`;
            return (
              <li key={field.key} className="flex flex-col rounded-[3px] border border-line bg-white/60 p-2.5">
                <div className="relative">
                  <ProductThumb url={url} alt={images[i]?.alt || `${productName || "Product"} — image ${i + 1}`} sizes="(min-width: 1280px) 200px, (min-width: 640px) 30vw, 45vw" className="w-full" />
                  {i === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-charcoal px-2.5 py-1 font-ui text-[10px] uppercase tracking-[0.12em] text-ivory">
                      Main
                    </span>
                  )}
                </div>
                <label htmlFor={`image-${i}-alt`} className="mt-2.5 block font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3">
                  Alt text
                </label>
                <input
                  id={`image-${i}-alt`}
                  placeholder={`${productName || "Product"} — ${i === 0 ? "front" : "detail"}`}
                  aria-invalid={err?.alt ? true : undefined}
                  aria-describedby={err?.alt || err?.url ? `image-${i}-error` : undefined}
                  className={cellInputClasses(Boolean(err?.alt), "mt-1 h-9 text-[13px]")}
                  {...register(`images.${i}.alt`)}
                />
                <CellError id={`image-${i}-error`} message={err?.url?.message ?? err?.alt?.message} />
                <div className="mt-2 flex items-center justify-between gap-1">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveTo(i, i - 1)}
                      disabled={i === 0}
                      className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-cream disabled:opacity-30"
                    >
                      <ArrowLeft aria-hidden className="size-4" strokeWidth={1.5} />
                      <span className="sr-only">Move {name} earlier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTo(i, i + 1)}
                      disabled={i === fields.length - 1}
                      className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-cream disabled:opacity-30"
                    >
                      <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
                      <span className="sr-only">Move {name} later</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-blush hover:text-sale"
                  >
                    <Trash2 aria-hidden className="size-4" strokeWidth={1.5} />
                    <span className="sr-only">Remove {name}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {typeof errors.images?.message === "string" && (
        <p role="alert" className="mt-3 text-[13px] text-sale">
          {errors.images.message}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button size="sm" variant="secondary" onClick={() => setPickerOpen(true)} disabled={room <= 0} icon={<ImagePlus aria-hidden className="size-4" strokeWidth={1.5} />}>
          Choose from library
        </Button>
        {uploadsEnabled && (
          <>
            <input
              ref={fileInput}
              type="file"
              accept={IMAGE_UPLOAD.types.join(",")}
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                const files = [...(e.target.files ?? [])];
                e.target.value = "";
                if (files.length) void upload(files);
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileInput.current?.click()}
              disabled={room <= 0 || uploading !== null}
              loading={uploading !== null}
              icon={<Upload aria-hidden className="size-4" strokeWidth={1.5} />}
            >
              {uploading ? `Uploading ${uploading.done + 1} of ${uploading.total}…` : "Upload images"}
            </Button>
          </>
        )}
        <p className="text-[13px] text-ink-3">
          {fields.length}/{PRODUCT_LIMITS.images} images
          {uploadsEnabled ? " · JPEG, PNG, WebP or AVIF up to 10 MB" : " · demo store: photos come from the bundled library"}
        </p>
      </div>
      <p aria-live="polite" className="sr-only">
        {notice}
      </p>

      <ImagePicker
        open={pickerOpen}
        library={library}
        taken={new Set(images.map((img) => img?.url))}
        room={room}
        onClose={() => setPickerOpen(false)}
        onAdd={(urls) => {
          append(
            urls.map((url) => ({ id: "", url, alt: "" })),
            { shouldFocus: false },
          );
          setNotice(`Added ${urls.length} ${urls.length === 1 ? "image" : "images"}.`);
        }}
      />
    </div>
  );
}

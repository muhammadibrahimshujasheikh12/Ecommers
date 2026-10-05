"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { CellError, MiniLabel, cellInputClasses } from "./form-bits";
import { PRODUCT_LIMITS } from "./model";
import type { ProductFormInput, ProductFormOutput } from "./schema";

const LABEL_SUGGESTIONS = ["Fit", "Length", "Pieces", "Fabric", "Embellishment", "Dupatta", "Trouser", "Lining", "Model wears"];

/** Label/value rows shown as the product's specification list. */
export function DetailsEditor() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ProductFormInput, unknown, ProductFormOutput>();
  const { fields, append, remove } = useFieldArray({ control, name: "details", keyName: "key" });

  return (
    <div>
      <datalist id="admin-detail-labels">
        {LABEL_SUGGESTIONS.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
      {fields.length === 0 ? (
        <p className="text-[14px] text-ink-3">No details yet — add rows like “Fit: Relaxed straight fit”.</p>
      ) : (
        <ul className="space-y-3">
          {fields.map((field, i) => {
            const err = errors.details?.[i];
            return (
              <li key={field.key} className="flex items-start gap-2 sm:gap-3">
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-3">
                  <div>
                    <MiniLabel htmlFor={`detail-${i}-label`} className={i > 0 ? "sm:sr-only" : undefined}>
                      Label
                    </MiniLabel>
                    <input
                      id={`detail-${i}-label`}
                      list="admin-detail-labels"
                      aria-invalid={err?.label ? true : undefined}
                      aria-describedby={err?.label ? `detail-${i}-label-error` : undefined}
                      className={cellInputClasses(Boolean(err?.label))}
                      {...register(`details.${i}.label`)}
                    />
                    <CellError id={`detail-${i}-label-error`} message={err?.label?.message} />
                  </div>
                  <div>
                    <MiniLabel htmlFor={`detail-${i}-value`} className={i > 0 ? "sm:sr-only" : undefined}>
                      Value
                    </MiniLabel>
                    <input
                      id={`detail-${i}-value`}
                      aria-invalid={err?.value ? true : undefined}
                      aria-describedby={err?.value ? `detail-${i}-value-error` : undefined}
                      className={cellInputClasses(Boolean(err?.value))}
                      {...register(`details.${i}.value`)}
                    />
                    <CellError id={`detail-${i}-value-error`} message={err?.value?.message} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className={cn("mt-[22px] grid size-10 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-blush hover:text-sale", i > 0 && "sm:mt-0")}
                >
                  <Trash2 aria-hidden className="size-4" strokeWidth={1.5} />
                  <span className="sr-only">Remove detail {i + 1}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="mt-4 -ml-2 px-3"
        disabled={fields.length >= PRODUCT_LIMITS.details}
        onClick={() => append({ label: "", value: "" }, { focusName: `details.${fields.length}.label` })}
        icon={<Plus aria-hidden className="size-4" strokeWidth={1.6} />}
      >
        Add detail
      </Button>
    </div>
  );
}

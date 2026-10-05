"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Modal confirmation for changes that can't be taken back. Built on <dialog>:
 * focus moves into it (to Cancel, the safe choice), Escape cancels, and focus
 * returns to the opener when it closes.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onCancel();
      }}
      className="m-auto w-[min(92vw,440px)] rounded-[4px] bg-ivory p-0 text-charcoal shadow-[var(--shadow-overlay)] backdrop:bg-charcoal/40"
    >
      <div className="p-6 md:p-7">
        <div className="flex items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#efcdc7] text-sale">
            <TriangleAlert aria-hidden className="size-5" strokeWidth={1.6} />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-[26px] font-medium leading-tight">
              {title}
            </h2>
            <div id={bodyId} className="mt-2 text-[14px] leading-relaxed text-ink-2">
              {children}
            </div>
          </div>
        </div>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={pending}>
            Keep as is
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            aria-busy={pending || undefined}
            className="inline-flex h-10 items-center justify-center gap-2.5 whitespace-nowrap bg-sale px-5 font-ui text-[11px] font-medium uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#7f382e] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending && <span aria-hidden className="size-4 animate-spin rounded-full border-[1.5px] border-current border-r-transparent" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

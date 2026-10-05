"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { BodyPortal } from "./portal";

/**
 * Modal confirmation for destructive or far-reaching actions, on the native
 * <dialog> (focus is trapped, Escape cancels, the page behind is inert).
 * Focus starts on Cancel so a stray Enter never confirms.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  tone = "danger",
  pending = false,
  confirmDisabled = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "default";
  pending?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
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
    <BodyPortal>
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onClose();
      }}
      className="m-auto w-[calc(100%-32px)] max-w-[440px] rounded-[3px] border border-line bg-ivory p-0 text-charcoal shadow-[var(--shadow-overlay)]"
    >
      <div className="p-6 md:p-7">
        <h2 id={titleId} className="font-display text-[26px] font-medium leading-tight">
          {title}
        </h2>
        <div id={bodyId} className="mt-3 space-y-3 text-[14px] leading-relaxed text-ink-2">
          {children}
        </div>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={pending} autoFocus>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            loading={pending}
            disabled={confirmDisabled}
            className={cn(tone === "danger" && "bg-sale hover:bg-sale/90 disabled:bg-line")}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
    </BodyPortal>
  );
}

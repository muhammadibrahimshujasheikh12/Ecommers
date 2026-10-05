"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  side?: "right" | "left" | "top" | "bottom";
  title: string;
  hideTitle?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  headerExtra?: ReactNode;
};

/**
 * Accessible drawer built on the native <dialog> element: focus is trapped,
 * Escape closes it, the page behind is inert and focus returns to the opener.
 */
export function Drawer({ open, onClose, side = "right", title, hideTitle, children, footer, className, headerExtra }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (!open) document.documentElement.style.overflow = "";
  }, [open]);

  useEffect(() => () => void (document.documentElement.style.overflow = ""), []);

  // Top/bottom sheets take their content's height: `h-fit`, because a modal dialog is pinned to
  // top and bottom, so `h-auto` would stretch it to the max height. The inner column repeats the
  // cap so long content scrolls inside the sheet rather than overflowing it.
  const position = {
    right: "ml-auto mr-0 w-full max-w-[460px] translate-x-full open:translate-x-0 starting:open:translate-x-full",
    left: "ml-0 mr-auto w-[92vw] max-w-[420px] -translate-x-full open:translate-x-0 starting:open:-translate-x-full",
    top: "!h-fit max-h-[100dvh] w-full max-w-none -translate-y-full open:translate-y-0 starting:open:-translate-y-full",
    bottom: "mt-auto !h-fit max-h-[90dvh] w-full max-w-none translate-y-full open:translate-y-0 starting:open:translate-y-full",
  }[side];
  const cap = side === "top" ? "max-h-[100dvh]" : side === "bottom" ? "max-h-[90dvh]" : undefined;

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn("dialog-drawer", position, className)}
    >
      <div className={cn("flex h-full flex-col", cap)}>
        <div className={cn("flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line px-5 md:h-[72px] md:px-7", hideTitle && "sr-only-heading")}>
          <h2 className={cn("ui-label", hideTitle && "sr-only")}>{title}</h2>
          {headerExtra}
          <button type="button" onClick={onClose} className="-mr-2 grid size-11 place-items-center text-charcoal transition-opacity hover:opacity-70" aria-label="Close">
            <X className="size-5" strokeWidth={1.4} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="shrink-0 border-t border-line px-5 py-5 md:px-7 md:py-6">{footer}</div>}
      </div>
    </dialog>
  );
}

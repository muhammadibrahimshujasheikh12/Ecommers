"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, CircleAlert, X } from "lucide-react";
import { cn } from "@/utils/cn";

type Toast = { id: number; message: string; tone: "success" | "error" | "info"; action?: { label: string; href?: string; onClick?: () => void } };
type ToastInput = Omit<Toast, "id" | "tone"> & { tone?: Toast["tone"] };

const ToastContext = createContext<((t: ToastInput) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++;
      setToasts((all) => [...all.slice(-2), { id, tone: "success", ...input }]);
      window.setTimeout(() => dismiss(id), input.tone === "error" ? 6000 : 3800);
    },
    [dismiss],
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 md:bottom-8">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-md animate-fade-up items-center gap-4 rounded-[4px] px-5 py-4 font-ui text-[14px] tracking-[0.02em] shadow-[var(--shadow-overlay)]",
              t.tone === "error" ? "bg-sale text-ivory" : "bg-charcoal text-ivory",
            )}
          >
            {t.tone === "error" ? <CircleAlert className="size-4 shrink-0" strokeWidth={1.6} /> : <Check className="size-4 shrink-0" strokeWidth={1.6} />}
            <span className="flex-1">{t.message}</span>
            {t.action &&
              (t.action.href ? (
                <Link href={t.action.href} onClick={() => dismiss(t.id)} className="text-[12px] font-medium uppercase tracking-[0.14em] underline underline-offset-4">
                  {t.action.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick?.();
                    dismiss(t.id);
                  }}
                  className="text-[12px] font-medium uppercase tracking-[0.14em] underline underline-offset-4"
                >
                  {t.action.label}
                </button>
              ))}
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="-mr-1 opacity-70 hover:opacity-100">
              <X className="size-4" strokeWidth={1.6} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

import Image from "next/image";
import type { ReactNode } from "react";

/** Split layout for authentication pages: form + campaign image. */
export function AuthShell({ eyebrow, title, intro, children, footer }: { eyebrow: string; title: string; intro?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-[calc(100dvh-200px)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-14 md:py-20">
        <div className="w-full max-w-[440px]">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="heading-page mt-3">{title}</h1>
          {intro && <p className="mt-4 text-ink-2">{intro}</p>}
          <div className="mt-10">{children}</div>
          {footer && <div className="mt-10 border-t border-line pt-8 text-center text-[14px] text-ink-2">{footer}</div>}
        </div>
      </div>
      <div className="relative hidden bg-beige lg:block">
        <Image src="/images/campaigns/story-festive.jpg" alt="" fill sizes="50vw" className="object-cover" priority />
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(transparent,rgb(30_27_25/0.4))] p-12 text-ivory">
          <p className="eyebrow !text-ivory">Members</p>
          <p className="mt-3 max-w-sm font-display text-[32px] leading-tight">Early access to new collections and private offers.</p>
        </div>
      </div>
    </div>
  );
}

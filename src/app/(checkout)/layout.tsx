import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Logo } from "@/components/ui/content";
import { site } from "@/content/site";

/** Distraction-free checkout chrome. */
export default function CheckoutLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-line bg-ivory">
        <div className="container-site grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-20">
          <Link href="/cart" aria-label="Back to bag" className="inline-flex items-center gap-2 font-ui text-[12px] uppercase tracking-[0.14em] text-ink-2 hover:text-charcoal">
            <ArrowLeft className="size-4" strokeWidth={1.4} /> <span className="hidden sm:inline">Back to bag</span>
          </Link>
          <Link href="/" aria-label="AURAQ — home">
            <Logo small />
          </Link>
          <p className="inline-flex items-center justify-self-end gap-2 font-ui text-[12px] uppercase tracking-[0.14em] text-ink-2">
            <Lock className="size-4" strokeWidth={1.4} /> <span className="hidden sm:inline">Secure checkout</span>
          </p>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="min-h-[70vh] outline-none">
        {children}
      </main>
      <footer className="border-t border-line py-8">
        <div className="container-site flex flex-col gap-3 font-ui text-[13px] text-ink-2 md:flex-row md:justify-between">
          <p>
            Need help? Call {site.contact.phone} or email {site.contact.email}
          </p>
          <nav aria-label="Policies" className="flex gap-5">
            <Link href="/shipping-policy" className="hover:text-charcoal">
              Shipping
            </Link>
            <Link href="/return-policy" className="hover:text-charcoal">
              Returns
            </Link>
            <Link href="/privacy-policy" className="hover:text-charcoal">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}

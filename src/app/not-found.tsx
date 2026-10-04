import Link from "next/link";
import { Logo } from "@/components/ui/content";
import { ButtonLink } from "@/components/ui/button";

/** Fallback for URLs outside the storefront layouts. */
export default function GlobalNotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-ivory px-4 text-center">
      <div>
        <Link href="/" aria-label="AURAQ — home" className="inline-block">
          <Logo />
        </Link>
        <p className="eyebrow mt-14">Error 404</p>
        <h1 className="heading-page mt-3">Page not found</h1>
        <p className="mx-auto mt-4 max-w-md text-ink-2">The page you’re looking for doesn’t exist or has moved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">Back to home</ButtonLink>
          <ButtonLink href="/shop" variant="secondary">
            Shop all
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ProductsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex flex-col items-center px-4 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-blush text-sale">
        <CircleAlert aria-hidden className="size-6" strokeWidth={1.4} />
      </span>
      <h1 className="mt-5 font-display text-[34px] font-medium leading-tight">Products couldn’t load</h1>
      <p className="mt-2 max-w-md text-[14px] text-ink-2">
        Something went wrong while loading the catalogue. Nothing was changed. Try again in a moment.
        {error.digest && <span className="mt-2 block font-ui text-[12px] text-ink-3">Reference: {error.digest}</span>}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button size="sm" onClick={() => retry()}>
          Try again
        </Button>
        <ButtonLink href="/admin" size="sm" variant="secondary">
          Back to dashboard
        </ButtonLink>
      </div>
    </div>
  );
}

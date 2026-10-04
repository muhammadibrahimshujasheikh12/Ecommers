"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-site py-10">
      <EmptyState
        icon={<CircleAlert className="size-6" strokeWidth={1.2} />}
        title="Something went wrong"
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>Try again</Button>
            <ButtonLink href="/" variant="secondary">
              Back to home
            </ButtonLink>
          </div>
        }
      >
        We couldn’t load this page right now. Please try again in a moment.
        {error.digest && <span className="mt-2 block font-ui text-[12px] text-ink-3">Reference: {error.digest}</span>}
      </EmptyState>
    </div>
  );
}

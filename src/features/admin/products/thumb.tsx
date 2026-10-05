import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/utils/cn";

const storagePrefix = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/`
  : null;

/** Bundled and Supabase Storage photos go through the image optimiser; anything else is shown as-is. */
const optimisable = (url: string) => url.startsWith("/") || (storagePrefix !== null && url.startsWith(storagePrefix));

/** Product photo in a 3:4 frame (the catalogue's portrait ratio), or a placeholder. */
export function ProductThumb({ url, alt, sizes = "48px", className }: { url: string | null | undefined; alt: string; sizes?: string; className?: string }) {
  return (
    <span className={cn("relative block aspect-[3/4] shrink-0 overflow-hidden rounded-[2px] bg-beige", className)}>
      {url ? (
        <Image src={url} alt={alt} fill sizes={sizes} unoptimized={!optimisable(url)} className="object-cover" />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-ink-3">
          <ImageOff aria-hidden className="size-4" strokeWidth={1.5} />
          <span className="sr-only">No image</span>
        </span>
      )}
    </span>
  );
}

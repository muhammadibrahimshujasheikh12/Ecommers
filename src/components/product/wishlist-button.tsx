"use client";

import { Heart } from "lucide-react";
import { useTransition } from "react";
import { useWishlist } from "@/features/wishlist/wishlist-provider";
import { cn } from "@/utils/cn";

export function WishlistButton({ productId, name, className, variant = "icon" }: { productId: string; name: string; className?: string; variant?: "icon" | "button" }) {
  const wishlist = useWishlist();
  const [pending, start] = useTransition();
  const saved = wishlist.has(productId);
  const label = saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`;

  const onClick = () => start(() => wishlist.toggle(productId, name));

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={saved}
        aria-label={label}
        className={cn("grid size-14 shrink-0 place-items-center border border-charcoal transition-colors hover:bg-cream", className)}
      >
        <Heart className={cn("size-5 transition-transform", saved && "fill-sale stroke-sale", pending && "scale-90")} strokeWidth={1.3} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={label}
      className={cn("grid size-10 place-items-center rounded-full text-charcoal transition-colors hover:bg-ivory/85", className)}
    >
      <Heart className={cn("size-[19px] transition-transform duration-300", saved && "scale-110 fill-sale stroke-sale")} strokeWidth={1.3} />
    </button>
  );
}

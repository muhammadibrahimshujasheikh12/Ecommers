import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="container-site pb-20 pt-10" role="status" aria-busy aria-label="Loading products">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-10 h-12 w-72" />
      <div className="mt-14 grid gap-10 lg:grid-cols-[240px_1fr]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="mt-4 h-4 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

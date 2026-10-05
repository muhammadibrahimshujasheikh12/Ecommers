import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div role="status" aria-busy aria-label="Loading products" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-11 w-56" />
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-11 w-full max-w-md" />
      <div className="rounded-[3px] border border-line bg-white/70 p-5 md:p-6">
        <div className="mb-6 flex flex-wrap gap-3">
          <Skeleton className="h-11 w-64" />
          <Skeleton className="h-11 w-44" />
          <Skeleton className="h-11 w-36" />
          <Skeleton className="h-11 w-40" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-[58px] w-11" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-busy aria-label="Loading">
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}

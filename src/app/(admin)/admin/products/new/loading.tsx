import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div role="status" aria-busy aria-label="Loading the product form" className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-11 w-72" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-64" />
          <Skeleton className="h-40" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-56" />
          <Skeleton className="h-72" />
        </div>
      </div>
    </div>
  );
}

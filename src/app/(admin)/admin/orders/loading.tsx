import { Skeleton } from "@/components/ui/misc";

export default function AdminOrdersLoading() {
  return (
    <div role="status" aria-label="Loading orders">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <Skeleton className="mt-10 h-11 w-full" />
      <div className="mt-6 space-y-2 rounded-[3px] border border-line bg-white/70 p-5">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

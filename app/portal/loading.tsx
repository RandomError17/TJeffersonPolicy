import { LoadingRows, Skeleton } from "@/components/ui/States";

/** Shown while a portal page's data resolves. */
export default function PortalLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-80" />
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
      <div className="mt-6">
        <LoadingRows rows={3} />
      </div>
    </div>
  );
}

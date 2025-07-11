import { Skeleton } from "@/components/ui/skeleton"

export function SearchSkeleton() {
  return (
    <div className="space-y-3">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="flex items-start gap-2 p-2">
            <Skeleton className="h-12 w-8 rounded" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
    </div>
  )
}

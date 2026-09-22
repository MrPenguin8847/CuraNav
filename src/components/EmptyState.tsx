import { SearchX, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-4">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-5">
        <SearchX className="w-8 h-8 text-muted" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">No hospitals found</h3>
      <p className="text-sm text-muted max-w-sm mb-6">
        We couldn&apos;t find hospitals matching your specific criteria. Try broadening your
        budget range, expanding the search radius, or removing a required facility.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          New Search
        </Link>
        <button className="btn-secondary inline-flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Adjust Filters
        </button>
      </div>
    </div>
  );
}

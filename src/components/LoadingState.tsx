export function SkeletonCard() {
  return (
    <div className="card p-5 md:p-6 animate-pulse">
      {/* Top row */}
      <div className="flex justify-between mb-4">
        <div className="flex-1">
          <div className="flex gap-2 mb-2">
            <div className="h-5 w-24 bg-slate-200 rounded-full" />
            <div className="h-5 w-20 bg-slate-200 rounded-full" />
          </div>
          <div className="h-6 w-2/3 bg-slate-200 rounded-lg mb-2" />
          <div className="h-4 w-1/3 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-7 w-32 bg-slate-200 rounded-full" />
      </div>

      {/* Cost block */}
      <div className="h-16 bg-slate-100 rounded-xl mb-4" />

      {/* Facility chips */}
      <div className="flex gap-2 mb-4">
        {[80, 64, 96, 72].map((w) => (
          <div key={w} className={`h-7 w-${w === 80 ? "20" : w === 64 ? "16" : w === 96 ? "24" : "18"} bg-slate-200 rounded-full`} />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border pt-3 flex justify-between items-center">
        <div className="h-4 w-40 bg-slate-100 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-slate-200 rounded-full" />
          <div className="h-9 w-28 bg-slate-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

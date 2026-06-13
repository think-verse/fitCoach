export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        <div className="h-9 w-56 rounded-lg shimmer-bg" />
      </header>

      {/* Primary CTA card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-3">
            <div className="h-6 w-48 rounded-lg shimmer-bg" />
            <div className="h-4 w-64 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-10 w-28 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      {/* Quick-action grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
          >
            <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-24 rounded shimmer-bg" />
              <div className="h-3 w-40 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

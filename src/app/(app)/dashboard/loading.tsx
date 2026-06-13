export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
          <div className="h-9 w-48 rounded-lg shimmer-bg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-28 rounded-full bg-muted animate-pulse" />
          <div className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
        </div>
      </header>

      {/* Banner card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-3">
            <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
            <div className="h-7 w-56 rounded-lg shimmer-bg" />
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-10 w-24 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      {/* StatCard grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-border bg-card p-5"
          >
            <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
            <div className="h-7 w-20 rounded shimmer-bg" />
            <div className="h-3 w-16 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart + side card */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-32 rounded bg-muted animate-pulse" />
              <div className="h-3 w-40 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-8 w-24 rounded-lg bg-muted animate-pulse" />
          </div>
          <div className="h-48 w-full rounded-xl shimmer-bg" />
        </div>
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="h-5 w-28 rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-10 w-full rounded-lg shimmer-bg" />
        </div>
      </div>
    </div>
  );
}

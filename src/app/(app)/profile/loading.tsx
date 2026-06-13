export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="h-9 w-40 rounded-lg shimmer-bg" />
      </header>

      {/* Profile summary card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-5">
          <div className="h-24 w-24 rounded-full shimmer-bg" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-7 w-28 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </div>

      {/* Stat grid */}
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

      {/* Chart card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 h-5 w-32 rounded bg-muted animate-pulse" />
        <div className="h-48 w-full rounded-xl shimmer-bg" />
      </div>
    </div>
  );
}

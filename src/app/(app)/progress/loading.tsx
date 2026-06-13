export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="h-9 w-44 rounded-lg shimmer-bg" />
      </header>

      {/* Chart card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          <div className="h-8 w-24 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="h-48 w-full rounded-xl shimmer-bg" />
      </div>

      {/* Stacked list cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="h-6 w-16 rounded-lg shimmer-bg" />
        </div>
      ))}
    </div>
  );
}

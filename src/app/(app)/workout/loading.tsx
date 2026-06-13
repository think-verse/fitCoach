export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <div className="h-4 w-28 rounded bg-muted animate-pulse" />
        <div className="h-9 w-52 rounded-lg shimmer-bg" />
      </header>

      {/* Exercise rows */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
          >
            <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 rounded shimmer-bg" />
              <div className="h-3 w-28 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-6 w-20 rounded-lg bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

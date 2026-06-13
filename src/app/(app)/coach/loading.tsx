export default function Loading() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="space-y-2">
        <div className="h-4 w-28 rounded bg-muted animate-pulse" />
        <div className="h-9 w-44 rounded-lg shimmer-bg" />
      </header>

      {/* Chat bubbles */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex justify-start">
          <div className="h-16 w-3/5 rounded-2xl bg-muted animate-pulse" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-2/5 rounded-2xl shimmer-bg" />
        </div>
        <div className="flex justify-start">
          <div className="h-20 w-3/4 rounded-2xl bg-muted animate-pulse" />
        </div>
        <div className="flex justify-end">
          <div className="h-12 w-1/2 rounded-2xl shimmer-bg" />
        </div>
        <div className="flex justify-start">
          <div className="h-14 w-2/3 rounded-2xl bg-muted animate-pulse" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-1/3 rounded-2xl shimmer-bg" />
        </div>
      </div>
    </div>
  );
}

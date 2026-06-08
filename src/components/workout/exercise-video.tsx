"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Looping demo video for one exercise. Lazy-autoplays only when scrolled into
 * view, so a workout day with 5 cards doesn't run 5 videos simultaneously on
 * mobile. The wrapper enforces 16:9 (matches the source 1920x1080) so it never
 * stretches taller than the video — no empty black space below.
 */
export function ExerciseVideo({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          void el.play().catch(() => {
            /* autoplay blocked — silent retry on next view */
          });
        } else {
          el.pause();
        }
      },
      { rootMargin: "100px", threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [src]);

  if (!src) {
    return (
      <div
        aria-label={`${alt} — demo not available`}
        className={cn(
          "flex aspect-video w-full items-center justify-center rounded-xl border border-border bg-muted/30 text-xs text-muted-foreground",
          className,
        )}
      >
        No demo available
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-xl bg-black/40",
        className,
      )}
    >
      <video
        ref={ref}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={`${alt} demo loop`}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {!visible && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <Play className="h-10 w-10 fill-white/80 text-white/80" />
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Looping demo video for one exercise. Lazy-autoplays only when scrolled into
 * view, so a workout day with 5 cards doesn't run 5 videos simultaneously on
 * mobile. Falls back to a static placeholder when no URL is available.
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
            /* user gesture required on some browsers — silent retry next view */
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
    // No video for this exercise yet — graceful placeholder.
    return (
      <div
        aria-label={`${alt} — demo not available`}
        className={cn(
          "flex aspect-video w-full items-center justify-center rounded-xl border border-border bg-muted/30 text-muted-foreground",
          className,
        )}
      >
        <span className="text-xs">No demo available</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-black", className)}>
      <video
        ref={ref}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={`${alt} demo loop`}
        className="aspect-video h-auto w-full object-cover"
      />
      {!visible && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <Play className="h-8 w-8 fill-white/80 text-white/80" />
        </div>
      )}
    </div>
  );
}

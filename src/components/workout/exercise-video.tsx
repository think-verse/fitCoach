"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Play, X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Looping demo video for one exercise.
 *  • Inline thumbnail: lazy-autoplay (only the card in view plays).
 *  • Click thumbnail → opens centered modal with a big version and native
 *    controls. ESC, click-outside, and the X button all close it.
 */
export function ExerciseVideo({
  src,
  alt,
  title,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  /** Heading shown in the expanded dialog. Defaults to `alt`. */
  title?: string;
  className?: string;
}) {
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
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={`Expand ${alt} demo`}
          className={cn(
            "group block w-full overflow-hidden rounded-xl ring-offset-background transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className,
          )}
        >
          <InlineThumb src={src} alt={alt} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out"
        />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <Dialog.Title className="truncate text-base font-semibold">
              {title ?? alt}
            </Dialog.Title>
            <Dialog.Close className="-mr-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          <div className="relative aspect-video w-full bg-black">
            <video
              key={src}
              src={src}
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="auto"
              className="absolute inset-0 h-full w-full object-contain"
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inline (card) thumbnail with lazy-on-scroll autoplay                       */
/* -------------------------------------------------------------------------- */

function InlineThumb({ src, alt }: { src: string; alt: string }) {
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

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/40 transition-shadow group-hover:shadow-lg group-hover:shadow-primary/10">
      <video
        ref={ref}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={`${alt} demo loop`}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />

      {/* Expand affordance — visible on hover (desktop) and always on touch */}
      <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/60 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-0">
        <Maximize2 className="h-3.5 w-3.5 text-white" />
      </div>

      {/* Play indicator before the video is observed in view */}
      {!visible && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className="h-10 w-10 fill-white/80 text-white/80" />
        </div>
      )}
    </div>
  );
}

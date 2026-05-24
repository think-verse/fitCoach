"use client";

import { useRef, useState, useTransition } from "react";
import {
  Camera,
  CheckCircle2,
  Loader2,
  RotateCw,
  Upload,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { createClient } from "@/lib/supabase/client";
import { registerPhotosAndContinue } from "@/app/actions/photos";
import { cn } from "@/lib/utils";

const ANGLES = ["front", "side", "back"] as const;
type Angle = (typeof ANGLES)[number];

const POSE_TIPS: Record<Angle, string> = {
  front: "Stand straight, arms slightly out, palms facing camera.",
  side: "Side profile, arms hanging naturally at your sides.",
  back: "Same posture as front. Look straight ahead.",
};

interface Selected {
  angle: Angle;
  file: File;
  previewUrl: string;
}

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_PHOTO_BUCKET ?? "physique-photos";

export function PhotoUpload({
  userId,
  weekNumber = 0,
  onComplete,
}: {
  userId: string;
  weekNumber?: number;
  onComplete?: () => void;
}) {
  const [selected, setSelected] = useState<Record<Angle, Selected | null>>({
    front: null,
    side: null,
    back: null,
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<Angle, number>>({
    front: 0,
    side: 0,
    back: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const inputsRef = useRef<Record<Angle, HTMLInputElement | null>>({
    front: null,
    side: null,
    back: null,
  });

  function pick(angle: Angle, file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Max 8 MB per photo.");
      return;
    }
    setError(null);
    setSelected((s) => ({
      ...s,
      [angle]: {
        angle,
        file,
        previewUrl: URL.createObjectURL(file),
      },
    }));
  }

  function clear(angle: Angle) {
    setSelected((s) => {
      if (s[angle]) URL.revokeObjectURL(s[angle]!.previewUrl);
      return { ...s, [angle]: null };
    });
  }

  async function upload() {
    setError(null);
    const filled = ANGLES.filter((a) => selected[a]);
    if (filled.length < 3) {
      setError("Please add all three photos: front, side, back.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const uploads: { angle: Angle; storagePath: string }[] = [];

    try {
      for (const angle of ANGLES) {
        const item = selected[angle]!;
        const ext = item.file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/w${weekNumber}/${angle}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, item.file, {
            cacheControl: "3600",
            upsert: false,
            contentType: item.file.type,
          });
        if (upErr) throw upErr;
        setProgress((p) => ({ ...p, [angle]: 100 }));
        uploads.push({ angle, storagePath: path });
      }

      startTransition(async () => {
        if (onComplete) {
          // Custom completion handler (used by weekly check-in)
          await registerPhotosAndContinue({ uploads, weekNumber });
          onComplete();
        } else {
          await registerPhotosAndContinue({ uploads, weekNumber });
        }
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? `Upload failed: ${e.message}`
          : "Upload failed. Try again.",
      );
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Disclaimer>
        Use the <strong>same lighting, same pose, same distance</strong> each
        week — that's what makes the weekly comparison meaningful. AI visual
        estimate only, not a medical diagnosis.
      </Disclaimer>

      <div className="grid gap-4 md:grid-cols-3">
        {ANGLES.map((angle) => {
          const sel = selected[angle];
          return (
            <Card
              key={angle}
              className={cn(
                "relative overflow-hidden transition-all",
                sel && "border-primary/40",
              )}
            >
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold capitalize">
                    {angle} view
                  </span>
                  {sel ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Camera className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  {POSE_TIPS[angle]}
                </p>

                <label
                  className={cn(
                    "relative block aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-dashed transition-colors",
                    sel
                      ? "border-primary/40"
                      : "border-border hover:border-border/80",
                  )}
                >
                  <input
                    ref={(el) => {
                      inputsRef.current[angle] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => pick(angle, e.target.files?.[0])}
                  />
                  {sel ? (
                    <>
                      <Image
                        src={sel.previewUrl}
                        alt={`${angle} preview`}
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 200px, 50vw"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          clear(angle);
                        }}
                        className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1.5 text-foreground shadow"
                        aria-label="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      {uploading && progress[angle] > 0 && (
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/40">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress[angle]}%` }}
                            className="h-full bg-primary"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Tap to upload
                      </span>
                    </div>
                  )}
                </label>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          onClick={() => {
            ANGLES.forEach(clear);
            setProgress({ front: 0, side: 0, back: 0 });
          }}
          variant="ghost"
          disabled={uploading}
        >
          <RotateCw className="h-4 w-4" /> Reset
        </Button>
        <Button onClick={upload} disabled={uploading} size="lg">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Upload &amp; analyze
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

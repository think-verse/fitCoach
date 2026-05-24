"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UnlockButton({ analysisId }: { analysisId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pressed, setPressed] = useState(false);

  function unlock() {
    setPressed(true);
    startTransition(() => {
      router.push(`/generate?analysisId=${analysisId}`);
    });
  }

  return (
    <div className="relative">
      <motion.div
        className="absolute inset-0 -z-10 rounded-full bg-emerald-500/40 blur-3xl"
        animate={{ opacity: pressed ? 0.9 : [0.35, 0.6, 0.35] }}
        transition={{ duration: 2.5, repeat: pressed ? 0 : Infinity }}
      />
      <Button
        onClick={unlock}
        variant="unlock"
        size="xl"
        disabled={pressed}
        className="relative w-full overflow-hidden"
      >
        <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.4),transparent)] bg-[length:200%_100%] animate-shimmer" />
        <span className="relative flex items-center gap-2 text-base">
          {pressed ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Crafting your plan…
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" /> Unlock my AI fitness plan
              <Sparkles className="h-4 w-4" />
            </>
          )}
        </span>
      </Button>
    </div>
  );
}

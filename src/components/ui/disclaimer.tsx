import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function Disclaimer({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground",
        className,
      )}
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <div className="leading-relaxed">
        {children ?? (
          <>
            AI visual estimate — not a medical diagnosis. For fitness guidance only.
            For medical conditions, please consult a qualified professional. Use the
            same lighting, pose, and distance for accurate weekly comparison.
          </>
        )}
      </div>
    </div>
  );
}

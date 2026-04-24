import { Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExecutionControlsProps {
  phase: string;
  onRun: () => void;
  onStop: () => void;
  canRun?: boolean;
  canStop?: boolean;
  runLabel?: string;
  stopLabel?: string;
  className?: string;
}

export function ExecutionControls({
  phase,
  onRun,
  onStop,
  canRun = true,
  canStop = false,
  runLabel = "Run",
  stopLabel = "Stop",
  className,
}: ExecutionControlsProps) {
  const isRunning = phase === "running";

  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRun}
          disabled={!canRun}
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            "bg-brand text-brand-foreground hover:opacity-90",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <Play className="size-4 fill-current" />
          {runLabel}
        </button>

        <button
          type="button"
          onClick={onStop}
          disabled={!canStop}
          className={cn(
            "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
            "border-input bg-background hover:bg-accent hover:text-accent-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <Square className="size-4 fill-current" />
          {stopLabel}
        </button>
      </div>

      <span
        className={cn(
          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
          isRunning
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "bg-muted text-muted-foreground",
        )}
      >
        {phase}
      </span>
    </div>
  );
}

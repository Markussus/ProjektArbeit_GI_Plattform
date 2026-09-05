import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
  side?: "top" | "bottom";
}

export function Tooltip({
  label,
  children,
  className,
  side = "top",
}: TooltipProps) {
  const id = useId();
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      <span aria-describedby={id}>{children}</span>
      <span
        id={id}
        role="tooltip"
        className={cn(
          "bg-popover text-popover-foreground border-border pointer-events-none absolute right-0 z-50 hidden rounded-md border px-2 py-1 text-xs whitespace-nowrap shadow-lg group-focus-within/tooltip:block group-hover/tooltip:block",
          side === "bottom"
            ? "top-[calc(100%+0.4rem)]"
            : "bottom-[calc(100%+0.4rem)]",
        )}
      >
        {label}
      </span>
    </span>
  );
}

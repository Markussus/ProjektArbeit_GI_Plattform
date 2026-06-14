import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tooltip({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      <span aria-describedby={id}>{children}</span>
      <span
        id={id}
        role="tooltip"
        className="bg-popover text-popover-foreground border-border pointer-events-none absolute right-0 bottom-[calc(100%+0.4rem)] z-50 hidden rounded-md border px-2 py-1 text-xs whitespace-nowrap shadow-lg group-hover/tooltip:block group-focus-within/tooltip:block"
      >
        {label}
      </span>
    </span>
  );
}

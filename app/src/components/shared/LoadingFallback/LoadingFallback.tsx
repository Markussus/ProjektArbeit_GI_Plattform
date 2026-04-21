import { cn } from "@/lib/utils";

interface LoadingFallbackProps {
  className?: string;
  label?: string;
}

export function LoadingFallback({
  className,
  label = "Loading...",
}: LoadingFallbackProps) {
  return (
    <div
      className={cn(
        "flex min-h-40 items-center justify-center px-6 py-10",
        className,
      )}
    >
      <div className="text-muted-foreground animate-pulse text-sm font-medium">
        {label}
      </div>
    </div>
  );
}

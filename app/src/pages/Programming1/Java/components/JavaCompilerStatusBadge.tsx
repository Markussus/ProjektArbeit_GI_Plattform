import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { JavaCompilerStatus } from "./Simulator/domain/javaExecution";

export interface JavaCompilerStatusBadgeProps {
  status: JavaCompilerStatus;
  className?: string;
  testId?: string;
}

export function JavaCompilerStatusBadge({
  status,
  className,
  testId,
}: JavaCompilerStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      data-testid={testId}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
        status === "ready" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        status === "loading" && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        status === "failed" && "bg-red-500/15 text-red-700 dark:text-red-300",
        status === "not-loaded" && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {t(`java.compilerStatus.${status}`)}
    </span>
  );
}

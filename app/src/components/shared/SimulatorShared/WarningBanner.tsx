import type { ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";

type WarningVariant = "destructive" | "warning" | "info";

interface WarningBannerProps {
  variant: WarningVariant;
  title: string;
  children: ReactNode;
}

const VARIANT_STYLES: Record<
  WarningVariant,
  { wrapper: string; icon: ReactNode; titleClass: string; textClass: string }
> = {
  destructive: {
    wrapper: "bg-destructive/10 border-destructive",
    icon: (
      <AlertTriangle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
    ),
    titleClass: "text-destructive-foreground",
    textClass: "text-destructive-foreground",
  },
  warning: {
    wrapper: "bg-orange-500/10 border-orange-500",
    icon: <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />,
    titleClass: "text-orange-700 dark:text-orange-400",
    textClass: "text-orange-700 dark:text-orange-400",
  },
  info: {
    wrapper: "bg-muted border-muted-foreground",
    icon: <Info className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />,
    titleClass: "text-foreground",
    textClass: "text-foreground",
  },
};

export function WarningBanner({
  variant,
  title,
  children,
}: WarningBannerProps) {
  const styles = VARIANT_STYLES[variant];
  return (
    <div
      className={`flex items-start gap-3 rounded-r-md border-l-4 p-4 ${styles.wrapper}`}
    >
      {styles.icon}
      <p className={`text-sm ${styles.textClass}`}>
        <strong className={`mb-1 block ${styles.titleClass}`}>{title}</strong>
        {children}
      </p>
    </div>
  );
}

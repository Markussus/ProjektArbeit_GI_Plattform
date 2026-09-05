import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface InlineResetControlProps {
  label: string;
  confirmationText: string;
  onConfirm: () => void;
  testId: string;
  className?: string;
}

export function InlineResetControl({
  label,
  confirmationText,
  onConfirm,
  testId,
  className,
}: InlineResetControlProps) {
  const { t } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        data-testid={testId}
        aria-label={label}
        className={cn(
          "border-border bg-background text-foreground hover:bg-muted focus-visible:ring-ring inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:outline-none",
          className,
        )}
      >
        <RotateCcw className="size-4" />
        {label}
      </button>
    );
  }

  return (
    <div
      data-testid={`${testId}-confirmation`}
      className={cn(
        "border-border bg-background animate-in slide-in-from-right-2 inline-flex min-h-9 w-fit items-center gap-2 rounded-md border px-2 py-1 duration-200",
        className,
      )}
    >
      <span className="text-foreground px-1 text-sm font-medium">
        {confirmationText}
      </span>
      <button
        type="button"
        onClick={() => {
          onConfirm();
          setIsConfirming(false);
        }}
        data-testid={`${testId}-confirm`}
        aria-label={t("common.confirm")}
        title={t("common.confirm")}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
      >
        <Check className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => setIsConfirming(false)}
        data-testid={`${testId}-cancel`}
        aria-label={t("common.cancel")}
        title={t("common.cancel")}
        className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

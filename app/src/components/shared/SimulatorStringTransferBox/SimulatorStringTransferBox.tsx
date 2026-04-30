import { useEffect, useMemo, useState } from "react";
import { Clipboard, Download, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";

export interface SimulatorStringTransferBoxProps<TValue> {
  value: TValue;
  codec: ISimulatorTransferCodec<TValue>;
  onLoad: (value: TValue) => void;
  className?: string;
}

export function SimulatorStringTransferBox<TValue>({
  value,
  codec,
  onLoad,
  className,
}: SimulatorStringTransferBoxProps<TValue>) {
  const { t } = useTranslation();
  const [textValue, setTextValue] = useState("");
  const [inputMode, setInputMode] = useState<"empty" | "generated" | "manual">(
    "empty",
  );
  const [feedbackKey, setFeedbackKey] = useState<
    | "simulation.transfer.copied"
    | "simulation.transfer.importSuccess"
    | "simulation.transfer.importError"
    | null
  >(null);

  useEffect(() => {
    if (!feedbackKey) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedbackKey(null);
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [feedbackKey]);

  const trimmedValue = textValue.trim();
  const hasText = trimmedValue.length > 0;
  const hasManualInput = hasText && inputMode === "manual";
  const isShowingCopyFeedback = feedbackKey === "simulation.transfer.copied";
  const inputDisplayValue = isShowingCopyFeedback
    ? t("simulation.transfer.copied")
    : textValue;

  const feedbackToneClassName = useMemo(() => {
    if (feedbackKey === "simulation.transfer.importError") {
      return "text-destructive";
    }

    return "text-muted-foreground";
  }, [feedbackKey]);

  const handleGenerate = () => {
    void (async () => {
      const nextValue = await codec.exportValue(value);
      setTextValue(nextValue);
      setInputMode("generated");
      setFeedbackKey(null);
    })();
  };

  const handleCopy = async () => {
    if (!hasText) {
      return;
    }

    await navigator.clipboard.writeText(trimmedValue);
    setFeedbackKey("simulation.transfer.copied");
  };

  const handleLoad = () => {
    void (async () => {
      try {
        const importedValue = await codec.importValue(trimmedValue);

        onLoad(importedValue);
        setTextValue("");
        setInputMode("empty");
        setFeedbackKey("simulation.transfer.importSuccess");
      } catch {
        setFeedbackKey("simulation.transfer.importError");
      }
    })();
  };

  return (
    <section
      className={cn(
        "bg-card ring-foreground/10 flex w-full flex-col gap-4 rounded-xl p-4 ring-1",
        className,
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            value={inputDisplayValue}
            onChange={(event) => {
              if (isShowingCopyFeedback) {
                return;
              }

              const nextValue = event.target.value;
              setTextValue(nextValue);
              setInputMode(nextValue.trim().length === 0 ? "empty" : "manual");
            }}
            onPaste={() => {
              if (isShowingCopyFeedback) {
                return;
              }

              if (trimmedValue.length > 0) {
                setInputMode("manual");
              }
            }}
            placeholder={t("simulation.transfer.placeholder")}
            className="border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring h-11 w-full rounded-lg border px-3 pr-12 text-sm outline-none focus-visible:ring-2"
            spellCheck={false}
            autoComplete="off"
            readOnly={isShowingCopyFeedback}
          />

          <button
            type="button"
            onClick={() => {
              void handleCopy();
            }}
            disabled={!hasText}
            aria-label={t("simulation.transfer.copy")}
            title={t("simulation.transfer.copy")}
            className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-3 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Clipboard className="size-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={hasManualInput}
            className="bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="size-4" />
            {t("simulation.transfer.export")}
          </button>

          <button
            type="button"
            onClick={handleLoad}
            disabled={!hasManualInput}
            className="bg-secondary text-secondary-foreground inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="size-4" />
            {t("simulation.transfer.import")}
          </button>
        </div>
      </div>

      {feedbackKey && feedbackKey !== "simulation.transfer.copied" && (
        <p className={cn("text-xs", feedbackToneClassName)}>{t(feedbackKey)}</p>
      )}
    </section>
  );
}

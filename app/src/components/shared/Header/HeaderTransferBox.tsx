import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { resolveTrainingCenterImportTarget } from "@/lib/trainingCenter/trainingCenterImportNavigation";
import { useActiveSimulatorTransferStore } from "@/hooks/useActiveSimulatorTransfer";

type Feedback =
  | "importError"
  | "exportError"
  | "clipboardError"
  | "copied"
  | null;

const EXPORT_PREVIEW_DURATION_MS = 5000;

export function HeaderTransferBox() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportPreview, setExportPreview] = useState<string | null>(null);
  const exportPreviewTimeoutRef = useRef<number | null>(null);
  const activeTransfer = useActiveSimulatorTransferStore(
    (state) => state.activeTransfer,
  );

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFeedback(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  useEffect(
    () => () => {
      if (exportPreviewTimeoutRef.current !== null) {
        window.clearTimeout(exportPreviewTimeoutRef.current);
      }
    },
    [],
  );

  const trimmedValue = value.trim();
  const isExportPreviewActive = exportPreview !== null;
  const displayedValue = exportPreview ?? value;
  const canImport = !isExportPreviewActive && trimmedValue.length > 0;
  const feedbackText = useMemo(() => {
    if (feedback === "importError") {
      return t("simulation.transfer.importError");
    }

    if (feedback === "exportError") {
      return t("simulation.transfer.exportError");
    }

    if (feedback === "clipboardError") {
      return t("simulation.transfer.clipboardError");
    }

    if (feedback === "copied") {
      return t("simulation.transfer.copied");
    }

    return "";
  }, [feedback, t]);

  const handleImport = () => {
    try {
      const target = resolveTrainingCenterImportTarget(trimmedValue);
      setValue("");
      setFeedback(null);
      navigate(target.path, {
        state: {
          trainingCenterImport: {
            storageValue: target.storageValue,
          },
        },
      });
    } catch {
      setFeedback("importError");
    }
  };

  const handleExport = async () => {
    if (!activeTransfer || isExporting) {
      return;
    }

    setIsExporting(true);
    setFeedback(null);
    try {
      const exportedValue = await activeTransfer.exportValue();
      if (exportPreviewTimeoutRef.current !== null) {
        window.clearTimeout(exportPreviewTimeoutRef.current);
      }
      setValue("");
      setExportPreview(exportedValue);
      exportPreviewTimeoutRef.current = window.setTimeout(() => {
        setExportPreview(null);
        exportPreviewTimeoutRef.current = null;
      }, EXPORT_PREVIEW_DURATION_MS);

      try {
        await navigator.clipboard.writeText(exportedValue);
        setFeedback("copied");
      } catch {
        setFeedback("clipboardError");
      }
    } catch {
      setFeedback("exportError");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      data-testid="header-transfer-root"
      className="relative flex max-w-sm min-w-0 flex-1 items-center gap-1 sm:gap-1.5 lg:max-w-md"
    >
      <input
        type="text"
        data-testid="header-transfer-input"
        value={displayedValue}
        readOnly={isExportPreviewActive}
        onChange={(event) => {
          if (isExportPreviewActive) {
            return;
          }
          setValue(event.target.value);
          setFeedback(null);
        }}
        onFocus={(event) => {
          if (isExportPreviewActive) {
            event.currentTarget.select();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && canImport) {
            handleImport();
          }
        }}
        placeholder={t("simulation.transfer.placeholder")}
        aria-label={
          isExportPreviewActive
            ? t("simulation.transfer.exportPreviewLabel")
            : undefined
        }
        className={cn(
          "border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring h-8 min-w-4 flex-1 rounded-md border px-2 text-xs outline-none focus-visible:ring-2 sm:h-9 sm:min-w-16 md:min-w-24",
          feedback === "importError" && "border-destructive",
        )}
        spellCheck={false}
        autoComplete="off"
      />

      <button
        type="button"
        data-testid="header-transfer-export"
        onClick={() => void handleExport()}
        disabled={!activeTransfer || isExporting}
        aria-busy={isExporting}
        aria-label={t("simulation.transfer.export")}
        title={t("simulation.transfer.export")}
        className="bg-brand text-brand-foreground inline-flex size-8 shrink-0 items-center justify-center gap-1.5 rounded-md text-xs font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:size-9 lg:w-auto lg:px-2.5"
      >
        <Download className="size-3.5" />
        <span className="hidden lg:inline">
          {t("simulation.transfer.export")}
        </span>
      </button>

      <button
        type="button"
        data-testid="header-transfer-import"
        onClick={handleImport}
        disabled={!canImport}
        aria-label={t("simulation.transfer.import")}
        title={t("simulation.transfer.import")}
        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 inline-flex size-8 shrink-0 items-center justify-center gap-1.5 rounded-md text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 sm:size-9 lg:w-auto lg:px-2.5"
      >
        <Upload className="size-3.5" />
        <span className="hidden lg:inline">
          {t("simulation.transfer.import")}
        </span>
      </button>

      {feedback && (
        <span
          data-testid="header-transfer-status"
          className={cn(
            "bg-background absolute top-full right-0 mt-1 rounded px-2 py-1 text-xs shadow-sm",
            feedback === "importError" || feedback === "exportError"
              ? "text-destructive"
              : "text-muted-foreground",
          )}
        >
          {feedbackText}
        </span>
      )}
    </div>
  );
}

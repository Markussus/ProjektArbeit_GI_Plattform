import { useEffect, useMemo, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { resolveTrainingCenterImportTarget } from "@/lib/trainingCenter/trainingCenterImportNavigation";

type Feedback = "error" | "exportLater" | null;

export function HeaderTransferBox() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFeedback(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const trimmedValue = value.trim();
  const canImport = trimmedValue.length > 0;
  const feedbackText = useMemo(() => {
    if (feedback === "error") {
      return t("simulation.transfer.importError");
    }

    if (feedback === "exportLater") {
      return t("simulation.transfer.export");
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
      setFeedback("error");
    }
  };

  return (
    <div
      data-testid="header-transfer-root"
      className="relative hidden min-w-0 max-w-sm flex-1 items-center gap-1.5 md:flex lg:max-w-md"
    >
      <input
        type="text"
        data-testid="header-transfer-input"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setFeedback(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && canImport) {
            handleImport();
          }
        }}
        placeholder={t("simulation.transfer.placeholder")}
        className={cn(
          "border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring h-9 min-w-24 flex-1 rounded-md border px-2 text-xs outline-none focus-visible:ring-2",
          feedback === "error" && "border-destructive",
        )}
        spellCheck={false}
        autoComplete="off"
      />

      <button
        type="button"
        data-testid="header-transfer-export"
        onClick={() => setFeedback("exportLater")}
        disabled
        aria-label={t("simulation.transfer.export")}
        title={t("simulation.transfer.export")}
        className="bg-brand text-brand-foreground inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="size-3.5" />
        <span className="hidden lg:inline">{t("simulation.transfer.export")}</span>
      </button>

      <button
        type="button"
        data-testid="header-transfer-import"
        onClick={handleImport}
        disabled={!canImport}
        aria-label={t("simulation.transfer.import")}
        title={t("simulation.transfer.import")}
        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Upload className="size-3.5" />
        <span className="hidden lg:inline">{t("simulation.transfer.import")}</span>
      </button>

      {feedback && (
        <span
          data-testid="header-transfer-status"
          className={cn(
            "bg-background absolute top-full right-0 mt-1 rounded px-2 py-1 text-xs shadow-sm",
            feedback === "error" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {feedbackText}
        </span>
      )}
    </div>
  );
}

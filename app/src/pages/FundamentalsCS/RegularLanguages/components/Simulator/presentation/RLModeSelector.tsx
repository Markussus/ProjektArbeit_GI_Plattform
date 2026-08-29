import { useTranslation } from "react-i18next";
import {
  Eye,
  FileText,
  ListOrdered,
  Maximize2,
  RotateCcw,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SimulationMode } from "../domain/rlTypes";

interface RLModeSelectorProps {
  mode: SimulationMode;
  onChange: (mode: SimulationMode) => void;
  isFocused?: boolean;
  onToggleFocus?: () => void;
  onReset?: () => void;
}

interface ModeMeta {
  id: SimulationMode;
  icon: LucideIcon;
  labelKey: string;
  fallback: string;
}

const MODES: ModeMeta[] = [
  {
    id: "grammarToLanguage",
    icon: ListOrdered,
    labelKey: "regular-languages.simulator.modes.grammarToLanguage",
    fallback: "Grammar → Language",
  },
  {
    id: "languageToGrammar",
    icon: FileText,
    labelKey: "regular-languages.simulator.modes.languageToGrammar",
    fallback: "Language → Grammar",
  },
  {
    id: "recognizeWord",
    icon: Eye,
    labelKey: "regular-languages.simulator.modes.recognizeWord",
    fallback: "Recognize Word",
  },
];

export function RLModeSelector({
  mode,
  onChange,
  isFocused,
  onToggleFocus,
  onReset,
}: RLModeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* 3 distinct standalone blocks with even spacing */}
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
        {MODES.map(({ id, icon: Icon, labelKey, fallback }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border p-3 text-center text-sm font-medium transition-all",
                active
                  ? "bg-brand text-brand-foreground border-brand font-semibold shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground shadow-xs",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t(labelKey, fallback)}</span>
            </button>
          );
        })}
      </div>

      {/* Action buttons (Reset & Expand) placed alongside without any overlap */}
      {(onReset || onToggleFocus) && (
        <div className="flex shrink-0 items-center justify-end gap-2">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              data-testid="simulation-reset"
              aria-label={t("common.trainingCenter.resetCurrent")}
              title={t("common.trainingCenter.resetCurrent")}
              className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-9 shrink-0 items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:outline-none"
            >
              <RotateCcw className="size-4" />
            </button>
          )}
          {onToggleFocus && (
            <button
              type="button"
              onClick={onToggleFocus}
              data-testid="simulation-focus-toggle"
              aria-pressed={isFocused}
              aria-label={
                isFocused
                  ? t("common.simulation.exitFocus")
                  : t("common.simulation.expand")
              }
              title={
                isFocused
                  ? t("common.simulation.close")
                  : t("common.simulation.expand")
              }
              className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-9 shrink-0 items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:outline-none"
            >
              {isFocused ? (
                <X className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

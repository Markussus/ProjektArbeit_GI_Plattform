import { useTranslation } from "react-i18next";
import { Eye, FileText, ListOrdered, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SimulationMode } from "../domain/rlTypes";

interface RLModeSelectorProps {
  mode: SimulationMode;
  onChange: (mode: SimulationMode) => void;
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
    labelKey: "rl.simulator.modes.grammarToLanguage",
    fallback: "Grammar → Language",
  },
  {
    id: "languageToGrammar",
    icon: FileText,
    labelKey: "rl.simulator.modes.languageToGrammar",
    fallback: "Language → Grammar",
  },
  {
    id: "recognizeWord",
    icon: Eye,
    labelKey: "rl.simulator.modes.recognizeWord",
    fallback: "Recognize Word",
  },
];

export function RLModeSelector({ mode, onChange }: RLModeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-card ring-foreground/10 rounded-xl p-2 ring-1">
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
        {MODES.map(({ id, icon: Icon, labelKey, fallback }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t(labelKey, fallback)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

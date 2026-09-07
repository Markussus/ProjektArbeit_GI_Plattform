import { useTranslation } from "react-i18next";
import { Eye, FileText, ListOrdered, type LucideIcon } from "lucide-react";
import { InlineTabNavigation } from "@/components/shared/InlineTabNavigation";
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

/** Tab order of the three modes, each with the icon its cards also use. */
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

export function RLModeSelector({ mode, onChange }: RLModeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full md:pr-24">
      <InlineTabNavigation<SimulationMode>
        activeTab={mode}
        onTabChange={onChange}
        ariaLabel={t(
          "regular-languages.simulator.modeSelector",
          "Simulation Mode",
        )}
        tabs={MODES.map(({ id, icon: Icon, labelKey, fallback }) => ({
          id,
          label: (
            <span className="flex items-center gap-2">
              <Icon className="size-4 shrink-0" />
              <span>{t(labelKey, fallback)}</span>
            </span>
          ),
          testId: `rl-mode-tab-${id}`,
        }))}
      />
    </div>
  );
}

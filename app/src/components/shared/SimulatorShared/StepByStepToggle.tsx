import { List, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StepByStepToggleProps {
  open: boolean;
  onToggle: () => void;
  className?: string;
  testId?: string;
}

export function StepByStepToggle({
  open,
  onToggle,
  className = "",
  testId,
}: StepByStepToggleProps) {
  const { t } = useTranslation("translation");
  return (
    <button
      onClick={onToggle}
      data-testid={testId}
      className={`text-primary hover:text-primary/80 mb-4 flex items-center gap-2 text-sm font-medium ${className}`}
    >
      <List className="h-4 w-4" />
      {t("simulator.arithmetic.common.showStepByStep")}
      {open ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </button>
  );
}

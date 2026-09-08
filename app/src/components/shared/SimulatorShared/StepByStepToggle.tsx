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
  const label = t("number-systems.simulator.arithmetic.common.showStepByStep");

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={label}
      data-testid={testId}
      className={`text-primary hover:text-primary/80 mb-4 flex items-center gap-2 text-sm font-medium ${className}`}
    >
      <List className="h-4 w-4" />
      {label}
      {open ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </button>
  );
}

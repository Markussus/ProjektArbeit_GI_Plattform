import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Example, Exercise } from "@/types/exercise";
import { cn } from "@/lib/utils";
import { DnfBuilder } from "./DnfBuilder/DnfBuilder";
import { ExpressionBuilder } from "./ExpressionBuilder/ExpressionBuilder";
import { TableToDnfBuilder } from "./TableToDnfBuilder/TableToDnfBuilder";
import { getDnfExerciseDefinition } from "../exercises";
import { getDnfWalkthroughExample } from "../examples/walkthroughExamples";

type DnfSimulatorMode = "expression_to_truth_table" | "truth_table_to_dnf";

const simulatorModes: DnfSimulatorMode[] = [
  "expression_to_truth_table",
  "truth_table_to_dnf",
];

interface DnfSimulatorProps {
  selectedExercise?: Exercise | null;
  selectedExample?: Example | null;
  onExitExercise?: () => void;
  onExitExample?: () => void;
}

export function DnfSimulator({
  selectedExercise,
  selectedExample,
  onExitExercise,
  onExitExample,
}: DnfSimulatorProps) {
  const { t } = useTranslation();

  const walkthroughExample = selectedExample
    ? getDnfWalkthroughExample(selectedExample.id)
    : null;

  const selectedExerciseMode = selectedExercise
    ? (getDnfExerciseDefinition(selectedExercise.id)?.mode ??
      "expression_to_truth_table")
    : null;

  // Seed the active mode from a walkthrough example (if any) so the example
  // opens in its native mode, but let the user override by clicking a tab.
  // The component remounts when the example changes (parent uses a keyed
  // mount), so this initial value is recomputed for each new example.
  const [activeMode, setActiveMode] = useState<DnfSimulatorMode>(
    walkthroughExample?.mode ?? "expression_to_truth_table",
  );

  const visibleMode = selectedExerciseMode ?? activeMode;

  const handleModeClick = (mode: DnfSimulatorMode) => {
    if (mode === visibleMode) return;

    setActiveMode(mode);
    if (selectedExercise) {
      onExitExercise?.();
    } else if (walkthroughExample) {
      // Switching tabs while a walkthrough example is active drops the
      // example: the other mode has no seed data for it and the header would
      // otherwise still advertise the example as "selected".
      onExitExample?.();
    }
  };

  const renderContent = () => {
    if (selectedExercise) {
      return (
        <DnfBuilder
          key={selectedExercise.id}
          selectedExercise={selectedExercise}
        />
      );
    }

    if (
      walkthroughExample?.mode === "expression_to_truth_table" &&
      visibleMode === "expression_to_truth_table"
    ) {
      return (
        <ExpressionBuilder
          key={walkthroughExample.id}
          initialExpression={walkthroughExample.expression}
        />
      );
    }

    if (
      walkthroughExample?.mode === "truth_table_to_dnf" &&
      visibleMode === "truth_table_to_dnf"
    ) {
      return (
        <TableToDnfBuilder
          key={walkthroughExample.id}
          initialVariables={walkthroughExample.variables}
          initialResultValues={walkthroughExample.resultValues}
        />
      );
    }

    return visibleMode === "expression_to_truth_table" ? (
      <ExpressionBuilder />
    ) : (
      <TableToDnfBuilder />
    );
  };

  return (
    <div
      data-testid="dnf-simulator"
      data-mode={visibleMode}
      className="flex h-full flex-col space-y-6"
    >
      <div className="border-border flex gap-1 border-b">
        {simulatorModes.map((mode) => (
          <button
            key={mode}
            type="button"
            data-testid={`dnf-mode-tab-${mode}`}
            className={cn(
              "relative shrink-0 px-4 py-2.5 text-sm font-medium",
              visibleMode === mode
                ? "text-tab-active"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => handleModeClick(mode)}
          >
            {t(`dnf.simulator.tabs.${mode}`)}
            {visibleMode === mode && (
              <span className="bg-tab-indicator absolute inset-x-0 -bottom-px h-0.5" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1">{renderContent()}</div>
    </div>
  );
}

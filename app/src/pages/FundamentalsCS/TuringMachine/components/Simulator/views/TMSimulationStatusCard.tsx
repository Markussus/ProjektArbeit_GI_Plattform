import { useTranslation } from "react-i18next";
import type { TMState, TapeSymbol } from "../types";
import { formatState } from "../utils/tmFormatting";

export interface TMSimulationStatusCardProps {
  currentState: TMState;
  blankSymbol: TapeSymbol;
  error: Error | null;
}

export function TMSimulationStatusCard({
  currentState,
  blankSymbol,
  error,
}: TMSimulationStatusCardProps) {
  const { t } = useTranslation();
  const currentSymbol =
    currentState.tape[currentState.headPosition] || blankSymbol;

  return (
    <div className="bg-card mt-4 rounded-lg border p-4">
      <h3 className="mb-2 font-semibold">{t("tm.sim.status", "Status")}</h3>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="text-muted-foreground">
          {t("tm.sim.state", "Current State")}:
        </div>
        <div className="font-mono">
          {formatState(currentState.currentState)}
        </div>

        <div className="text-muted-foreground">
          {t("tm.sim.symbol", "Current Symbol")}:
        </div>
        <div className="font-mono">{currentSymbol}</div>

        <div className="text-muted-foreground">{t("tm.sim.step", "Step")}:</div>
        <div>{currentState.stepCount}</div>

        <div className="text-muted-foreground">
          {t("tm.sim.halt", "Halted")}:
        </div>
        <div>{currentState.isHalted ? "Yes" : "No"}</div>
      </div>

      {currentState.errorMessage && (
        <div className="bg-destructive/10 text-destructive mt-4 rounded p-2 text-sm">
          {currentState.errorMessage}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive mt-4 rounded p-2 text-sm">
          {error.message}
        </div>
      )}
    </div>
  );
}

import { useTranslation } from "react-i18next";
import type { TMProgram } from "../domain/tmProgram";
import type { TMRuntime } from "../domain/tmRuntime";
import { readCurrentSymbol } from "../domain/tmMachine";
import { formatState } from "../utils/tmFormatting";

export interface TMSimulationStatusCardProps {
  program: Pick<TMProgram, "blankSymbol">;
  runtime: TMRuntime;
  error: Error | null;
}

export function TMSimulationStatusCard({
  program,
  runtime,
  error,
}: TMSimulationStatusCardProps) {
  const { t } = useTranslation();
  const currentSymbol = readCurrentSymbol(program, runtime);
  const haltReasonMessage =
    runtime.haltReason?.type === "missing_transition"
      ? t("tm.sim.haltReason.missingTransition", {
          state: formatState(runtime.haltReason.state),
          symbol: runtime.haltReason.symbol,
        })
      : null;

  return (
    <div className="bg-card mt-4 rounded-lg border p-4">
      <h3 className="mb-2 font-semibold">{t("tm.sim.status")}</h3>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="text-muted-foreground">{t("tm.sim.state")}:</div>
        <div className="font-mono">{formatState(runtime.currentState)}</div>

        <div className="text-muted-foreground">{t("tm.sim.symbol")}:</div>
        <div className="font-mono">{currentSymbol}</div>

        <div className="text-muted-foreground">{t("tm.sim.step")}:</div>
        <div>{runtime.stepCount}</div>

        <div className="text-muted-foreground">{t("tm.sim.halt")}:</div>
        <div>{runtime.halted ? t("tm.sim.yes") : t("tm.sim.no")}</div>
      </div>

      {haltReasonMessage && (
        <div className="bg-destructive/10 text-destructive mt-4 rounded p-2 text-sm">
          {haltReasonMessage}
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

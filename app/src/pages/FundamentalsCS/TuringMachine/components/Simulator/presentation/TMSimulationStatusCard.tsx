import { useTranslation } from "react-i18next";
import type { TMProgram } from "../domain/tmProgram";
import type { TMRuntime } from "../domain/tmRuntime";
import { readCurrentSymbol } from "../domain/tmMachine";

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
      <h3 className="mb-2 font-semibold">{t("tm.sim.status.status")}</h3>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="text-muted-foreground">{t("tm.sim.status.state")}:</div>
        <div className="font-mono">{formatState(runtime.currentState)}</div>

        <div className="text-muted-foreground">
          {t("tm.sim.status.symbol")}:
        </div>
        <div className="font-mono">{currentSymbol}</div>

        <div className="text-muted-foreground">{t("tm.sim.status.step")}:</div>
        <div>{runtime.stepCount}</div>

        <div className="text-muted-foreground">{t("tm.sim.status.halt")}:</div>
        <div>
          {runtime.halted ? t("tm.sim.status.yes") : t("tm.sim.status.no")}
        </div>
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

function formatState(state: string): string {
  return state.replace(/\d+/g, (match) => {
    return match
      .split("")
      .map((digit) => String.fromCharCode(8320 + Number.parseInt(digit, 10)))
      .join("");
  });
}

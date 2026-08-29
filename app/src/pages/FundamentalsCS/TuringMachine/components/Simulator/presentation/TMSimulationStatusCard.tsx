import { useTranslation } from "react-i18next";
import { formatTMStateName } from "../domain/tmFormatting";
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
      ? t("turing-machine.sim.haltReason.missingTransition", {
          state: formatTMStateName(runtime.haltReason.state),
          symbol: runtime.haltReason.symbol,
        })
      : null;

  return (
    <div
      data-testid="tm-status-card"
      data-current-state={runtime.currentState}
      data-current-symbol={currentSymbol}
      data-step-count={runtime.stepCount}
      data-halted={runtime.halted}
      className="bg-card w-full max-w-md rounded-lg border p-4"
    >
      <h3 className="mb-2 font-semibold">
        {t("turing-machine.sim.status.status")}
      </h3>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="text-muted-foreground">
          {t("turing-machine.sim.status.state")}:
        </div>
        <div data-testid="tm-status-current-state" className="font-mono">
          {formatTMStateName(runtime.currentState)}
        </div>

        <div className="text-muted-foreground">
          {t("turing-machine.sim.status.symbol")}:
        </div>
        <div data-testid="tm-status-current-symbol" className="font-mono">
          {currentSymbol}
        </div>

        <div className="text-muted-foreground">
          {t("turing-machine.sim.status.step")}:
        </div>
        <div data-testid="tm-status-step-count">{runtime.stepCount}</div>

        <div className="text-muted-foreground">
          {t("turing-machine.sim.status.halt")}:
        </div>
        <div data-testid="tm-status-halted">
          {runtime.halted
            ? t("turing-machine.sim.status.yes")
            : t("turing-machine.sim.status.no")}
        </div>
      </div>

      {haltReasonMessage && (
        <div
          data-testid="tm-status-halt-reason"
          className="bg-destructive/10 text-destructive mt-4 rounded p-2 text-sm"
        >
          {haltReasonMessage}
        </div>
      )}

      {error && (
        <div
          data-testid="tm-status-error"
          className="bg-destructive/10 text-destructive mt-4 rounded p-2 text-sm"
        >
          {error.message}
        </div>
      )}
    </div>
  );
}

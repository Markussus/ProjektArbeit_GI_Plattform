import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { formatTMStateName } from "../domain/tmFormatting";
import type { TMProgram } from "../domain/tmProgram";
import type { TMRuntime } from "../domain/tmRuntime";
import { readCurrentSymbol } from "../domain/tmMachine";

export interface TMSimulationStatusCardProps {
  program: Pick<TMProgram, "blankSymbol">;
  runtime: TMRuntime;
  error: Error | null;
}

interface StatusItem {
  key: string;
  label: string;
  value: string;
  testId: string;
  isMono?: boolean;
}

export function TMSimulationStatusCard({
  program,
  runtime,
  error,
}: TMSimulationStatusCardProps) {
  const { t } = useTranslation();
  const currentSymbol = readCurrentSymbol(program, runtime);
  const haltReasonMessage = resolveHaltReasonMessage(runtime.haltReason, t);
  const statusItems = buildStatusItems(runtime, currentSymbol, t);

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
        {statusItems.map((item) => (
          <div key={item.key} className="contents">
            <div className="text-muted-foreground">{item.label}:</div>
            <div
              data-testid={item.testId}
              className={item.isMono ? "font-mono" : undefined}
            >
              {item.value}
            </div>
          </div>
        ))}
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

function resolveHaltReasonMessage(
  haltReason: TMRuntime["haltReason"],
  t: TFunction,
): string | null {
  if (haltReason?.type !== "missing_transition") {
    return null;
  }

  return t("turing-machine.sim.haltReason.missingTransition", {
    state: formatTMStateName(haltReason.state),
    symbol: haltReason.symbol,
  });
}

function buildStatusItems(
  runtime: TMRuntime,
  currentSymbol: string,
  t: TFunction,
): StatusItem[] {
  return [
    {
      key: "state",
      label: t("turing-machine.sim.status.state"),
      value: formatTMStateName(runtime.currentState),
      testId: "tm-status-current-state",
      isMono: true,
    },
    {
      key: "symbol",
      label: t("turing-machine.sim.status.symbol"),
      value: currentSymbol,
      testId: "tm-status-current-symbol",
      isMono: true,
    },
    {
      key: "step",
      label: t("turing-machine.sim.status.step"),
      value: String(runtime.stepCount),
      testId: "tm-status-step-count",
    },
    {
      key: "halt",
      label: t("turing-machine.sim.status.halt"),
      value: t(
        runtime.halted
          ? "turing-machine.sim.status.yes"
          : "turing-machine.sim.status.no",
      ),
      testId: "tm-status-halted",
    },
  ];
}

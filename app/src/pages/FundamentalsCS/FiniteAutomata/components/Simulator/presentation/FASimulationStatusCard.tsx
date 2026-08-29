import { useTranslation } from "react-i18next";
import type { FAProgram } from "../domain/faTypes";
import type { FARuntime } from "../domain/faRuntime";

interface FASimulationStatusCardProps {
  program: FAProgram;
  runtime: FARuntime;
  error: Error | null;
}

export function FASimulationStatusCard({
  program,
  runtime,
  error,
}: FASimulationStatusCardProps) {
  const { t } = useTranslation();

  const statusLabel = (() => {
    if (error) return t("finite-automata.sim.status.error", "Error");
    if (!runtime.halted)
      return t("finite-automata.sim.status.running", "Running");
    if (runtime.haltReason?.type === "accepted")
      return t("finite-automata.sim.status.accepted", "Accepted ✓");
    if (runtime.haltReason?.type === "rejected")
      return t("finite-automata.sim.status.rejected", "Rejected ✗");
    return t("finite-automata.sim.status.halted", "Halted");
  })();

  const statusColor = (() => {
    if (error) return "var(--fa-red)";
    if (!runtime.halted) return "var(--fa-cyan)";
    if (runtime.haltReason?.type === "accepted") return "var(--fa-green)";
    return "var(--fa-red)";
  })();

  const explanation = (() => {
    if (error) return error.message;
    if (!runtime.halted) {
      if (runtime.inputPosition < runtime.inputWord.length) {
        const symbol = runtime.inputWord[runtime.inputPosition];
        return t(
          "finite-automata.sim.explanation.reading",
          "Reading symbol '{{symbol}}' at position {{pos}}. Active states: {{states}}",
          {
            symbol,
            pos: runtime.inputPosition + 1,
            states: runtime.activeStates.join(", ") || "∅",
          },
        );
      }
      return t("finite-automata.sim.explanation.processing", "Processing...");
    }
    if (runtime.haltReason?.type === "accepted") {
      return t(
        "finite-automata.sim.explanation.accepted",
        "The word is accepted. Final states {{states}} include an accept state.",
        {
          states: runtime.activeStates.join(", "),
        },
      );
    }
    if (runtime.haltReason?.type === "rejected") {
      if (runtime.activeStates.length === 0) {
        return t(
          "finite-automata.sim.explanation.rejectedDead",
          "The word is rejected. No reachable states (dead end).",
        );
      }
      return t(
        "finite-automata.sim.explanation.rejected",
        "The word is rejected. Final states {{states}} do not include an accept state.",
        {
          states: runtime.activeStates.join(", "),
        },
      );
    }
    return "";
  })();

  return (
    <div className="rounded-[0.75rem] border border-(--fa-border) bg-(--fa-surface) p-4">
      <div className="flex flex-col gap-3">
        {/* Status header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-(--fa-text-dim) uppercase">
            {t("finite-automata.sim.status.label", "Status")}
          </span>
          <span
            className="text-sm font-bold"
            style={{
              color: statusColor,
              textShadow: `0 0 8px ${statusColor}40`,
            }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Info grid */}
        <div
          className="flex flex-col gap-1.5"
          style={{ fontSize: "0.8125rem" }}
        >
          <div className="flex justify-between">
            <span style={{ color: "var(--fa-text-dim)" }}>
              {t("finite-automata.sim.status.type", "Type")}
            </span>
            <span style={{ color: "var(--fa-text)", fontWeight: 600 }}>
              {program.type}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--fa-text-dim)" }}>
              {t("finite-automata.sim.status.step", "Step")}
            </span>
            <span style={{ color: "var(--fa-cyan)", fontWeight: 600 }}>
              {runtime.stepCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--fa-text-dim)" }}>
              {t("finite-automata.sim.status.activeStates", "Active States")}
            </span>
            <span
              className="font-mono"
              style={{ color: "var(--fa-text)", fontWeight: 600 }}
            >
              {runtime.activeStates.length > 0
                ? runtime.activeStates.join(", ")
                : "∅"}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--fa-text-dim)" }}>
              {t("finite-automata.sim.status.position", "Position")}
            </span>
            <span style={{ color: "var(--fa-text)", fontWeight: 600 }}>
              {runtime.inputPosition} / {runtime.inputWord.length}
            </span>
          </div>
        </div>

        {/* Explanation */}
        {explanation && (
          <div
            className="rounded-md p-3 text-sm leading-relaxed"
            style={{
              background: "var(--fa-surface-raised)",
              border: "1px solid var(--fa-border-subtle)",
              color: "var(--fa-text-dim)",
            }}
          >
            {explanation}
          </div>
        )}
      </div>
    </div>
  );
}

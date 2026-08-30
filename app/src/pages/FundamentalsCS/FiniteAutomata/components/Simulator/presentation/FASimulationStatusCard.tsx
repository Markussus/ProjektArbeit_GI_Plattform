import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
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

  const statusClassName = (() => {
    if (error) return "text-destructive";
    if (!runtime.halted) return "text-brand";
    if (runtime.haltReason?.type === "accepted")
      return "text-emerald-600 dark:text-emerald-400";
    return "text-destructive";
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
    <div className="border-border bg-card rounded-xl border p-4">
      <div className="flex flex-col gap-3">
        {/* Status header */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {t("finite-automata.sim.status.label", "Status")}
          </span>
          <span className={cn("text-sm font-bold", statusClassName)}>
            {statusLabel}
          </span>
        </div>

        {/* Info grid */}
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("finite-automata.sim.status.type", "Type")}
            </span>
            <span className="text-foreground font-semibold">
              {program.type}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("finite-automata.sim.status.step", "Step")}
            </span>
            <span className="text-brand font-semibold">
              {runtime.stepCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("finite-automata.sim.status.activeStates", "Active States")}
            </span>
            <span className="text-foreground font-mono font-semibold">
              {runtime.activeStates.length > 0
                ? runtime.activeStates.join(", ")
                : "∅"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("finite-automata.sim.status.position", "Position")}
            </span>
            <span className="text-foreground font-semibold">
              {runtime.inputPosition} / {runtime.inputWord.length}
            </span>
          </div>
        </div>

        {/* Explanation */}
        {explanation && (
          <div className="border-border bg-muted/40 text-muted-foreground rounded-lg border p-3 text-sm leading-relaxed">
            {explanation}
          </div>
        )}
      </div>
    </div>
  );
}

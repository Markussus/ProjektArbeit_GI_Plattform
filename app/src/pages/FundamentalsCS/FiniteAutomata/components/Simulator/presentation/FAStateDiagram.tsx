import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  StateMachineGraph,
  type StateMachineGraphEdge,
  type StateMachineGraphNode,
} from "@/components/shared/StateMachineGraph";
import type { FAProgram } from "../domain/faTypes";
import type { FARuntime } from "../domain/faRuntime";
import {
  findDFAViolations,
  buildViolationEdgeKeys,
  type DFAViolation,
} from "../domain/faDeterminismCheck";

export interface FAStateDiagramProps {
  program: FAProgram;
  runtime: FARuntime;
  className?: string;
}

export function FAStateDiagram({
  program,
  runtime,
  className,
}: FAStateDiagramProps) {
  const { t } = useTranslation();
  const violations = useMemo(() => findDFAViolations(program), [program]);
  const violationEdgeKeys = useMemo(
    () => buildViolationEdgeKeys(violations),
    [violations],
  );
  const violatingStates = useMemo(
    () => new Set(violations.map((v) => v.state)),
    [violations],
  );

  const activeSet = useMemo(
    () => new Set(runtime.activeStates),
    [runtime.activeStates],
  );
  const acceptSet = useMemo(
    () => new Set(program.acceptStates),
    [program.acceptStates],
  );

  const lastTransition =
    runtime.transitionHistory.length > 0
      ? runtime.transitionHistory[runtime.transitionHistory.length - 1]
      : null;

  const nodes: StateMachineGraphNode[] = useMemo(
    () =>
      program.states.map((state) => ({
        id: state,
        label: state,
        isStart: state === program.startState,
        isAccept: acceptSet.has(state),
        isActive: activeSet.has(state),
        isViolation: violatingStates.has(state),
      })),
    [acceptSet, activeSet, program.startState, program.states, violatingStates],
  );

  const edges: StateMachineGraphEdge[] = useMemo(() => {
    const list: StateMachineGraphEdge[] = [];
    for (const fromState of program.states) {
      const symbolMap = program.transitions[fromState] || {};
      for (const [symbol, targetStates] of Object.entries(symbolMap)) {
        for (const toState of targetStates) {
          const isActive =
            !!lastTransition &&
            lastTransition.fromStates.includes(fromState) &&
            lastTransition.toStates.includes(toState) &&
            lastTransition.symbol === symbol;
          const isViolation = violationEdgeKeys.has(`${fromState}__${toState}`);
          list.push({
            from: fromState,
            to: toState,
            label: symbol,
            isActive,
            isViolation,
          });
        }
      }
    }
    return list;
  }, [lastTransition, program.states, program.transitions, violationEdgeKeys]);

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <StateMachineGraph
        nodes={nodes}
        edges={edges}
        ariaLabel={t("finite-automata.diagram.title", "State Diagram")}
        testId="fa-state-diagram"
        className={className}
      />
      {violations.length > 0 && (
        <div className="border-border bg-card space-y-1.5 rounded-xl border p-3">
          <div className="text-destructive flex items-center gap-1.5 text-xs font-semibold">
            <span>⚠</span>
            <span>
              {t("finite-automata.diagram.violations", {
                count: violations.length,
              })}
            </span>
          </div>
          {violations.map((v, i) => (
            <ViolationNotice key={i} violation={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function ViolationNotice({ violation }: { violation: DFAViolation }) {
  const { t } = useTranslation();

  return (
    <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded px-2.5 py-1.5 text-xs">
      <span className="mt-0.5 flex-shrink-0">⚠</span>
      <span>
        {violation.type === "epsilon"
          ? t("finite-automata.diagram.violationEpsilon", {
              state: violation.state,
            })
          : t("finite-automata.diagram.violationNondeterministic", {
              state: violation.state,
              symbol: violation.symbol,
              targets: violation.targets.join(", "),
            })}
      </span>
    </div>
  );
}

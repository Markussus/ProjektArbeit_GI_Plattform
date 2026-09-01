// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FAStateDiagram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/presentation/FAStateDiagram";
import type { StateMachineGraphEdge } from "@/components/shared/StateMachineGraph";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import { EPSILON } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import type { FARuntime } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faRuntime";
import { defaultDFAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

// The graph itself is covered by its own tests; here it is a spy that records
// the node and edge lists the diagram derived from the program and runtime.
const graphProps = vi.hoisted(() => ({ current: null as never }));
vi.mock("@/components/shared/StateMachineGraph", () => ({
  StateMachineGraph: (props: unknown) => {
    graphProps.current = props as never;
    return <div data-testid="fa-state-diagram" />;
  },
}));

function edges(): StateMachineGraphEdge[] {
  return (graphProps.current as { edges: StateMachineGraphEdge[] }).edges;
}

function runtime(overrides: Partial<FARuntime> = {}): FARuntime {
  return {
    activeStates: ["S0"],
    inputWord: ["a", "b"],
    inputPosition: 0,
    stepCount: 0,
    halted: false,
    haltReason: null,
    stateHistory: [["S0"]],
    transitionHistory: [],
    ...overrides,
  };
}

afterEach(() => cleanup());

describe("FAStateDiagram — edges", () => {
  it("emits one edge per (state, symbol, target) triple", () => {
    render(<FAStateDiagram program={defaultDFAProgram} runtime={runtime()} />);

    const expected = Object.entries(defaultDFAProgram.transitions).flatMap(
      ([, row]) => Object.values(row).flat(),
    ).length;
    expect(edges()).toHaveLength(expected);
  });

  it("fans a nondeterministic cell out into one edge per target", () => {
    const nfa: FAProgram = {
      type: "NFA",
      states: ["S0", "S1"],
      alphabet: ["a"],
      transitions: { S0: { a: ["S0", "S1"] }, S1: {} },
      startState: "S0",
      acceptStates: ["S1"],
    };

    render(<FAStateDiagram program={nfa} runtime={runtime()} />);

    expect(edges().map((e) => `${e.from}-${e.label}-${e.to}`)).toEqual([
      "S0-a-S0",
      "S0-a-S1",
    ]);
  });

  it("marks only the edge the last transition actually took", () => {
    render(
      <FAStateDiagram
        program={defaultDFAProgram}
        runtime={runtime({
          transitionHistory: [
            { fromStates: ["S0"], symbol: "a", toStates: ["S1"] },
          ],
        })}
      />,
    );

    const active = edges().filter((e) => e.isActive);
    expect(active).toHaveLength(1);
    expect(active[0]).toMatchObject({ from: "S0", to: "S1", label: "a" });
  });

  it("keeps every edge inactive before the first transition", () => {
    render(<FAStateDiagram program={defaultDFAProgram} runtime={runtime()} />);

    expect(edges().every((e) => !e.isActive)).toBe(true);
  });

  it("does not activate an edge whose symbol differs from the one taken", () => {
    render(
      <FAStateDiagram
        program={defaultDFAProgram}
        runtime={runtime({
          transitionHistory: [
            { fromStates: ["S0"], symbol: "b", toStates: ["S1"] },
          ],
        })}
      />,
    );

    expect(
      edges().some(
        (e) =>
          e.from === "S0" && e.to === "S1" && e.label === "a" && e.isActive,
      ),
    ).toBe(false);
  });

  it("flags edges that break DFA determinism", () => {
    const broken: FAProgram = {
      ...defaultDFAProgram,
      transitions: {
        ...defaultDFAProgram.transitions,
        S0: { a: ["S0", "S1"], b: ["S0"] },
      },
    };

    render(<FAStateDiagram program={broken} runtime={runtime()} />);

    // The violation key is (from, to) only, so the `b` edge back to S0 is
    // highlighted too — it shares a pair with the nondeterministic `a` edge.
    const violating = edges().filter((e) => e.isViolation);
    expect(violating.map((e) => `${e.label}-${e.to}`).sort()).toEqual([
      "a-S0",
      "a-S1",
      "b-S0",
    ]);
  });

  it("flags an epsilon transition in a DFA and lists the violation", () => {
    const withEpsilon: FAProgram = {
      ...defaultDFAProgram,
      transitions: {
        ...defaultDFAProgram.transitions,
        S0: { [EPSILON]: ["S1"] },
      },
    };

    const { container } = render(
      <FAStateDiagram program={withEpsilon} runtime={runtime()} />,
    );

    expect(edges().some((e) => e.label === EPSILON && e.isViolation)).toBe(
      true,
    );
    expect(container.textContent).toContain(
      "finite-automata.diagram.violationEpsilon",
    );
  });

  it("skips states that have no transition row at all", () => {
    const sparse: FAProgram = {
      type: "DFA",
      states: ["S0", "S1"],
      alphabet: ["a"],
      transitions: { S0: { a: ["S1"] } },
      startState: "S0",
      acceptStates: ["S1"],
    };

    render(<FAStateDiagram program={sparse} runtime={runtime()} />);

    expect(edges()).toHaveLength(1);
  });
});

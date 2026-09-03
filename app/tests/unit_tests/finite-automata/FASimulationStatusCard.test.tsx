// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FASimulationStatusCard } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/presentation/FASimulationStatusCard";
import { FAInputWordView } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/presentation/FAInputWordView";
import type { FARuntime } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faRuntime";
import { defaultDFAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";

// `t` echoes the key, and interpolates the values the card passes in, so an
// assertion can tell the branches apart without depending on the translations.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown, options?: Record<string, unknown>) => {
      const params = (typeof fallback === "object" ? fallback : options) ?? {};
      const rendered = Object.entries(params)
        .map(([name, value]) => `${name}=${String(value)}`)
        .join(" ");
      return rendered ? `${key} ${rendered}` : key;
    },
  }),
}));

function runtime(overrides: Partial<FARuntime> = {}): FARuntime {
  return {
    activeStates: ["S0"],
    inputWord: ["a", "a", "b"],
    inputPosition: 0,
    stepCount: 0,
    halted: false,
    haltReason: null,
    stateHistory: [["S0"]],
    transitionHistory: [],
    ...overrides,
  };
}

function renderCard(over: Partial<FARuntime> = {}, error: Error | null = null) {
  render(
    <FASimulationStatusCard
      program={defaultDFAProgram}
      runtime={runtime(over)}
      error={error}
    />,
  );
}

afterEach(() => cleanup());

describe("FASimulationStatusCard — status label and styling", () => {
  it("shows the error status and message when the run failed", () => {
    renderCard({}, new Error("boom"));

    expect(
      screen.getByText("finite-automata.sim.status.error"),
    ).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("shows the running status while the machine has not halted", () => {
    renderCard();

    const label = screen.getByText("finite-automata.sim.status.running");
    expect(label).toBeInTheDocument();
    expect(label.className).toContain("text-brand");
  });

  it("shows the accepted status in the success colour", () => {
    renderCard({
      halted: true,
      haltReason: { type: "accepted", states: ["S2"] },
      activeStates: ["S2"],
      inputPosition: 3,
    });

    const label = screen.getByText("finite-automata.sim.status.accepted");
    expect(label.className).toContain("emerald");
  });

  it("shows the rejected status in the destructive colour", () => {
    renderCard({
      halted: true,
      haltReason: { type: "rejected", states: ["S1"] },
      activeStates: ["S1"],
      inputPosition: 3,
    });

    const label = screen.getByText("finite-automata.sim.status.rejected");
    expect(label.className).toContain("text-destructive");
  });

  it("falls back to the halted status when no reason was recorded", () => {
    renderCard({ halted: true, haltReason: null });

    expect(
      screen.getByText("finite-automata.sim.status.halted"),
    ).toBeInTheDocument();
  });
});

describe("FASimulationStatusCard — explanation", () => {
  it("names the symbol being read and the states it is read from", () => {
    renderCard({ inputPosition: 1, activeStates: ["S0", "S1"] });

    expect(
      screen.getByText(/finite-automata\.sim\.explanation\.reading/),
    ).toHaveTextContent("symbol=a pos=2 states=S0, S1");
  });

  it("renders the empty-state marker when no state is active mid-run", () => {
    renderCard({ inputPosition: 0, activeStates: [] });

    expect(
      screen.getByText(/finite-automata\.sim\.explanation\.reading/),
    ).toHaveTextContent("states=∅");
  });

  it("shows the processing note once the input is consumed but not halted", () => {
    renderCard({ inputPosition: 3 });

    expect(
      screen.getByText("finite-automata.sim.explanation.processing"),
    ).toBeInTheDocument();
  });

  it("lists the final states when the word is accepted", () => {
    renderCard({
      halted: true,
      haltReason: { type: "accepted", states: ["S2"] },
      activeStates: ["S2"],
      inputPosition: 3,
    });

    expect(
      screen.getByText(/finite-automata\.sim\.explanation\.accepted/),
    ).toHaveTextContent("states=S2");
  });

  it("lists the final states when the word is rejected in a live state", () => {
    renderCard({
      halted: true,
      haltReason: { type: "rejected", states: ["S1"] },
      activeStates: ["S1"],
      inputPosition: 3,
    });

    expect(
      screen.getByText(/finite-automata\.sim\.explanation\.rejected/),
    ).toHaveTextContent("states=S1");
  });

  it("calls out a dead end when the rejection left no reachable state", () => {
    renderCard({
      halted: true,
      haltReason: { type: "rejected", states: [] },
      activeStates: [],
      inputPosition: 2,
    });

    expect(
      screen.getByText("finite-automata.sim.explanation.rejectedDead"),
    ).toBeInTheDocument();
  });

  it("omits the explanation box when there is nothing to explain", () => {
    const { container } = render(
      <FASimulationStatusCard
        program={defaultDFAProgram}
        runtime={runtime({ halted: true, haltReason: null })}
        error={null}
      />,
    );

    expect(container.textContent).not.toContain(
      "finite-automata.sim.explanation",
    );
  });
});

describe("FAInputWordView", () => {
  it("renders one cell per symbol of the input word", () => {
    render(<FAInputWordView runtime={runtime()} />);

    expect(screen.getAllByText(/^[ab]$/)).toHaveLength(3);
    expect(
      screen.getByText(/finite-automata\.sim\.inputWordLength/),
    ).toHaveTextContent("count=3");
  });

  it("keeps the panel and shows ε for the empty word", () => {
    render(<FAInputWordView runtime={runtime({ inputWord: [] })} />);

    expect(
      screen.getByText("finite-automata.sim.emptyWord"),
    ).toBeInTheDocument();
    expect(screen.getByText("ε")).toBeInTheDocument();
  });

  it("highlights the symbol under the read head", () => {
    const { container } = render(
      <FAInputWordView runtime={runtime({ inputPosition: 1 })} />,
    );

    const cells = [...container.querySelectorAll("div.size-9")];
    expect(cells[0].className).toContain("opacity-50");
    expect(cells[1].className).toContain("border-brand");
    expect(cells[2].className).toContain("bg-background");
  });

  it("drops the read-head highlight once the run has halted", () => {
    const { container } = render(
      <FAInputWordView
        runtime={runtime({
          inputPosition: 1,
          halted: true,
          haltReason: { type: "rejected", states: [] },
        })}
      />,
    );

    const cells = [...container.querySelectorAll("div.size-9")];
    expect(cells[1].className).not.toContain("border-brand");
    // Neither read nor upcoming: the symbol the run stopped on.
    expect(cells[1].className).toContain("opacity-40");
  });
});

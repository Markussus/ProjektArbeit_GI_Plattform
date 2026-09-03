// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FATransitionTableEditor } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/presentation/FATransitionTableEditor";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import { EPSILON } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import {
  defaultDFAProgram,
  defaultNFAProgram,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

const noop = () => {};

describe("FATransitionTableEditor — DFA rendering", () => {
  beforeEach(() => {
    render(
      <FATransitionTableEditor
        program={defaultDFAProgram}
        onTransitionChange={noop}
      />,
    );
  });

  it("renders the 'Transition Table' heading", () => {
    expect(screen.getByText("Transition Table")).toBeInTheDocument();
  });

  it("renders the delta symbol as the first header cell", () => {
    expect(screen.getByText("δ")).toBeInTheDocument();
  });

  it("renders a header cell for each state", () => {
    for (const state of defaultDFAProgram.states) {
      const header = screen.getByRole("columnheader", {
        name: new RegExp(state),
      });
      expect(header).toBeInTheDocument();
    }
  });

  it("marks the start state with →", () => {
    const startStateHeader = screen.getByRole("columnheader", {
      name: new RegExp(`${defaultDFAProgram.startState}.*→`),
    });
    expect(startStateHeader).toBeInTheDocument();
  });

  it("marks the accept state with *", () => {
    const acceptState = defaultDFAProgram.acceptStates[0];
    const acceptHeader = screen.getByRole("columnheader", {
      name: new RegExp(`${acceptState}.*\\*`),
    });
    expect(acceptHeader).toBeInTheDocument();
  });

  it("renders one row per alphabet symbol", () => {
    for (const symbol of defaultDFAProgram.alphabet) {
      expect(screen.getAllByText(symbol).length).toBeGreaterThan(0);
    }
  });

  it("renders an input for each (state, symbol) pair", () => {
    const expectedCount =
      defaultDFAProgram.states.length * defaultDFAProgram.alphabet.length;
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(expectedCount);
  });

  it("each input has an aria-label describing the transition", () => {
    for (const state of defaultDFAProgram.states) {
      for (const symbol of defaultDFAProgram.alphabet) {
        const input = screen.getByLabelText(`δ(${state}, ${symbol})`);
        expect(input).toBeInTheDocument();
      }
    }
  });

  it("inputs show existing transition targets as pre-filled values", () => {
    // S0 -a-> S1
    const input = screen.getByLabelText("δ(S0, a)");
    expect((input as HTMLInputElement).value).toBe("S1");
  });

  it("does not render the epsilon toggle button for a DFA", () => {
    expect(
      screen.queryByTestId("fa-add-epsilon-transitions"),
    ).not.toBeInTheDocument();
  });
});

describe("FATransitionTableEditor — NFA rendering", () => {
  beforeEach(() => {
    render(
      <FATransitionTableEditor
        program={defaultNFAProgram}
        onTransitionChange={noop}
      />,
    );
  });

  it("shows the epsilon toggle button for an NFA", () => {
    expect(
      screen.getByTestId("fa-add-epsilon-transitions"),
    ).toBeInTheDocument();
  });

  it("adds the epsilon row when the toggle button is clicked", () => {
    const btn = screen.getByTestId("fa-add-epsilon-transitions");
    fireEvent.click(btn);
    expect(screen.getByLabelText("δ(S0, ε)")).toBeInTheDocument();
  });

  it("hides the epsilon button after clicking it", () => {
    const btn = screen.getByTestId("fa-add-epsilon-transitions");
    fireEvent.click(btn);
    expect(
      screen.queryByTestId("fa-add-epsilon-transitions"),
    ).not.toBeInTheDocument();
  });
});

describe("FATransitionTableEditor — NFA with existing epsilon transitions", () => {
  it("shows epsilon row without requiring a click when ε transitions already exist", () => {
    const nfaWithEps: FAProgram = {
      ...defaultNFAProgram,
      transitions: {
        ...defaultNFAProgram.transitions,
        S0: { ...defaultNFAProgram.transitions["S0"], [EPSILON]: ["S1"] },
      },
    };
    render(
      <FATransitionTableEditor
        program={nfaWithEps}
        onTransitionChange={noop}
      />,
    );
    expect(screen.getByLabelText("δ(S0, ε)")).toBeInTheDocument();
  });
});

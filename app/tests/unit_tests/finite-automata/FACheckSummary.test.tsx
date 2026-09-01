// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FACheckSummary } from "@/pages/FundamentalsCS/FiniteAutomata/components/FACheckSummary";
import type { ValidationResult } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faExerciseValidation";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const rendered = Object.entries(params ?? {})
        .map(([name, value]) => `${name}=${String(value)}`)
        .join(" ");
      return rendered ? `${key} ${rendered}` : key;
    },
  }),
}));

function result(overrides: Partial<ValidationResult> = {}): ValidationResult {
  return {
    passed: true,
    total: 10,
    passedCount: 10,
    failedCount: 0,
    firstFailure: null,
    cases: [],
    structuralIssues: [],
    ...overrides,
  };
}

const KEY = "finite-automata.exerciseWorkspace";

afterEach(() => cleanup());

describe("FACheckSummary", () => {
  it("tells the student nothing has been built yet", () => {
    render(<FACheckSummary result="unbuilt" />);

    expect(screen.getByText(`${KEY}.unbuiltTitle`)).toBeInTheDocument();
    expect(screen.getByText(`${KEY}.unbuiltBody`)).toBeInTheDocument();
  });

  it("reports structural problems ahead of any word-level verdict", () => {
    render(
      <FACheckSummary
        result={result({
          passed: false,
          structuralIssues: ["transition_target_invalid"],
          failedCount: 3,
        })}
      />,
    );

    expect(screen.getByText(`${KEY}.structuralFail`)).toBeInTheDocument();
    expect(screen.queryByText(`${KEY}.failed`)).not.toBeInTheDocument();
  });

  it("reports a pass with the number of words checked", () => {
    render(<FACheckSummary result={result()} />);

    expect(screen.getByText(`${KEY}.passed`)).toBeInTheDocument();
    expect(screen.getByText(/passedDetail/)).toHaveTextContent("n=10 total=10");
  });

  it("reports a failure with the pass and fail counts", () => {
    render(
      <FACheckSummary
        result={result({ passed: false, passedCount: 7, failedCount: 3 })}
      />,
    );

    expect(screen.getByText(`${KEY}.failed`)).toBeInTheDocument();
    expect(screen.getByText(/failedDetail/)).toHaveTextContent(
      "passed=7 total=10 failed=3",
    );
  });

  it("names the counterexample word and both verdicts", () => {
    const { container } = render(
      <FACheckSummary
        result={result({
          passed: false,
          passedCount: 9,
          failedCount: 1,
          firstFailure: {
            word: "ab",
            expected: true,
            got: false,
            passed: false,
          },
        })}
      />,
    );

    expect(screen.getByText("ab")).toBeInTheDocument();
    // Expected "accept", got "reject" — both verdicts sit in the same line.
    expect(container.textContent).toContain(`${KEY}.accept`);
    expect(container.textContent).toContain(`${KEY}.reject`);
  });

  it("renders the empty counterexample word as ε", () => {
    render(
      <FACheckSummary
        result={result({
          passed: false,
          failedCount: 1,
          firstFailure: { word: "", expected: false, got: true, passed: false },
        })}
      />,
    );

    expect(screen.getByText("ε")).toBeInTheDocument();
  });

  it("omits the counterexample line when there is no first failure", () => {
    render(
      <FACheckSummary result={result({ passed: false, failedCount: 2 })} />,
    );

    expect(screen.queryByText(`${KEY}.counterexample`)).not.toBeInTheDocument();
  });
});

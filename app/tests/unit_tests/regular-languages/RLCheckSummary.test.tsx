// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RLCheckSummary } from "@/pages/FundamentalsCS/RegularLanguages/components/RLCheckSummary";
import type { RLCheckResult } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlSolutionChecker";

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

const KEY = "regular-languages.exerciseWorkspace";

function result(overrides: Partial<RLCheckResult> = {}): RLCheckResult {
  return { status: "match", wrong: [], missing: [], ...overrides };
}

afterEach(() => cleanup());

describe("RLCheckSummary — invalid input", () => {
  it("explains an unparseable grammar", () => {
    render(
      <RLCheckSummary
        result={result({ status: "invalid", reason: "studentParse" })}
        isGrammarExercise={false}
      />,
    );

    expect(screen.getByText(`${KEY}.checkInvalidGrammar`)).toBeInTheDocument();
  });

  it("explains a missing reference solution", () => {
    render(
      <RLCheckSummary
        result={result({ status: "invalid", reason: "reference" })}
        isGrammarExercise={false}
      />,
    );

    expect(screen.getByText(`${KEY}.checkUnavailable`)).toBeInTheDocument();
  });

  it("explains an empty answer", () => {
    render(
      <RLCheckSummary
        result={result({ status: "invalid", reason: "studentEmpty" })}
        isGrammarExercise={false}
      />,
    );

    expect(screen.getByText(`${KEY}.checkEmpty`)).toBeInTheDocument();
  });
});

describe("RLCheckSummary — match", () => {
  it("uses the grammar → language wording for a grammar exercise", () => {
    render(<RLCheckSummary result={result()} isGrammarExercise />);

    expect(screen.getByText(`${KEY}.checkMatch`)).toBeInTheDocument();
    expect(screen.getByText(`${KEY}.checkMatchDetailG2L`)).toBeInTheDocument();
  });

  it("uses the language → grammar wording otherwise", () => {
    render(<RLCheckSummary result={result()} isGrammarExercise={false} />);

    expect(screen.getByText(`${KEY}.checkMatchDetailL2G`)).toBeInTheDocument();
  });
});

describe("RLCheckSummary — mismatch", () => {
  it("lists the wrong words with the grammar wording", () => {
    render(
      <RLCheckSummary
        result={result({ status: "mismatch", wrong: ["ab", ""] })}
        isGrammarExercise
      />,
    );

    expect(screen.getByText(`${KEY}.checkMismatch`)).toBeInTheDocument();
    expect(screen.getByText(/checkWrongG2L/)).toHaveTextContent("words=ab, ε");
  });

  it("lists the missing words with the language wording", () => {
    render(
      <RLCheckSummary
        result={result({ status: "mismatch", missing: ["aa"] })}
        isGrammarExercise={false}
      />,
    );

    expect(screen.getByText(/checkMissingL2G/)).toHaveTextContent("words=aa");
  });

  it("shows both lines when words are wrong and missing", () => {
    render(
      <RLCheckSummary
        result={result({ status: "mismatch", wrong: ["b"], missing: ["a"] })}
        isGrammarExercise
      />,
    );

    expect(screen.getByText(/checkWrongG2L/)).toBeInTheDocument();
    expect(screen.getByText(/checkMissingG2L/)).toBeInTheDocument();
  });

  it("omits both lines when neither list has entries", () => {
    const { container } = render(
      <RLCheckSummary
        result={result({ status: "mismatch" })}
        isGrammarExercise
      />,
    );

    expect(container.textContent).toBe(`${KEY}.checkMismatch`);
  });
});

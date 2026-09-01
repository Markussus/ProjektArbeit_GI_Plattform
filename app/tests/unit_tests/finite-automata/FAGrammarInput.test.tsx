// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FAGrammarInput } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/presentation/FAGrammarInput";
import { FABatchTester } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/presentation/FABatchTester";
import { defaultDFAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

function grammarField() {
  return screen.getByLabelText("Grammar");
}

afterEach(() => cleanup());

describe("FAGrammarInput", () => {
  it("disables conversion until the grammar parses", () => {
    render(<FAGrammarInput onConvert={vi.fn()} />);

    expect(screen.getByTestId("fa-convert-grammar")).toBeDisabled();
  });

  it("loads the built-in example into the editor", () => {
    render(<FAGrammarInput onConvert={vi.fn()} />);

    fireEvent.click(screen.getByTestId("fa-load-grammar-example"));

    expect(grammarField()).toHaveValue("S -> 0S | 1A\nA -> 0A | 1");
    expect(screen.getByTestId("fa-convert-grammar")).toBeEnabled();
  });

  it("converts a right-linear grammar into an automaton", () => {
    const onConvert = vi.fn();
    render(<FAGrammarInput onConvert={onConvert} />);

    fireEvent.change(grammarField(), {
      target: { value: "S -> 0S | 1A\nA -> 0A | 1" },
    });
    fireEvent.click(screen.getByTestId("fa-convert-grammar"));

    expect(onConvert).toHaveBeenCalledTimes(1);
    const program = onConvert.mock.calls[0][0];
    expect(program.startState).toBe("S");
    expect(program.alphabet.sort()).toEqual(["0", "1"]);
  });

  it("names the detected format once the source parses", () => {
    render(<FAGrammarInput onConvert={vi.fn()} />);

    fireEvent.change(grammarField(), { target: { value: "S -> 0S | 1" } });

    expect(screen.getByText("Detected format:")).toBeInTheDocument();
  });

  it("warns about an unparseable grammar while typing", () => {
    render(<FAGrammarInput onConvert={vi.fn()} />);

    fireEvent.change(grammarField(), { target: { value: "not a grammar" } });

    expect(screen.getByText("Grammar not parseable yet")).toBeInTheDocument();
  });

  it("stays quiet while the editor is still empty", () => {
    render(<FAGrammarInput onConvert={vi.fn()} />);

    fireEvent.change(grammarField(), { target: { value: "   " } });

    expect(
      screen.queryByText("Grammar not parseable yet"),
    ).not.toBeInTheDocument();
  });

  it("clears a previous error as soon as the source changes", () => {
    const onConvert = vi.fn();
    render(<FAGrammarInput onConvert={onConvert} />);

    fireEvent.change(grammarField(), { target: { value: "not a grammar" } });
    fireEvent.change(grammarField(), { target: { value: "S -> 0S | 1" } });
    fireEvent.click(screen.getByTestId("fa-convert-grammar"));

    expect(onConvert).toHaveBeenCalledTimes(1);
  });

  it("toggles the supported-formats help open", () => {
    render(<FAGrammarInput onConvert={vi.fn()} />);

    expect(screen.getByText("Format 1 — simplified")).toBeInTheDocument();
    expect(screen.getByText("Format 2 — structured")).toBeInTheDocument();
  });
});

describe("FABatchTester", () => {
  function words() {
    return screen.getByRole("textbox");
  }

  it("does nothing when the word list is empty", () => {
    render(<FABatchTester program={defaultDFAProgram} />);

    fireEvent.click(screen.getByTitle("Run All"));

    expect(words()).toBeInTheDocument();
    expect(screen.queryByTitle("Clear")).not.toBeInTheDocument();
  });

  it("runs every non-blank line and summarises the verdicts", () => {
    render(<FABatchTester program={defaultDFAProgram} />);

    fireEvent.change(words(), { target: { value: "aab\n\n  \naba" } });
    fireEvent.click(screen.getByTitle("Run All"));

    expect(screen.getByText("✅ 1")).toBeInTheDocument();
    expect(screen.getByText("❌ 1")).toBeInTheDocument();
    expect(screen.getByTitle("aab")).toBeInTheDocument();
    expect(screen.getByTitle("aba")).toBeInTheDocument();
  });

  it("renders the empty word as ε", () => {
    render(<FABatchTester program={defaultDFAProgram} />);

    fireEvent.change(words(), { target: { value: "aab" } });
    fireEvent.click(screen.getByTitle("Run All"));

    expect(screen.getByTitle("aab")).toHaveTextContent("aab");
  });

  it("reports the selected word back to the caller", () => {
    const onSelectWord = vi.fn();
    render(
      <FABatchTester program={defaultDFAProgram} onSelectWord={onSelectWord} />,
    );

    fireEvent.change(words(), { target: { value: "aab" } });
    fireEvent.click(screen.getByTitle("Run All"));
    fireEvent.click(screen.getByTitle("aab"));

    expect(onSelectWord).toHaveBeenCalledWith("aab");
  });

  it("returns to the input field when the results are cleared", () => {
    render(<FABatchTester program={defaultDFAProgram} />);

    fireEvent.change(words(), { target: { value: "aab" } });
    fireEvent.click(screen.getByTitle("Run All"));
    fireEvent.click(screen.getByTitle("Clear"));

    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.queryByTitle("aab")).not.toBeInTheDocument();
  });
});

/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RLGrammarInputCard } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/presentation/RLGrammarInputCard";
import { RLGrammarToLanguage } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/presentation/RLGrammarToLanguage";
import { RLLanguageToGrammar } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/presentation/RLLanguageToGrammar";
import { RLWordRecognizer } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/presentation/RLWordRecognizer";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

const GRAMMAR = "S -> aS | b";

afterEach(() => cleanup());

describe("RLGrammarInputCard", () => {
  it("renders the default title and reports edits", () => {
    const onChange = vi.fn();
    render(
      <RLGrammarInputCard value="" onChange={onChange} testId="rl-card" />,
    );

    fireEvent.change(screen.getByTestId("rl-card"), {
      target: { value: GRAMMAR },
    });

    expect(onChange).toHaveBeenCalledWith(GRAMMAR);
    expect(screen.getByText("Grammar")).toBeInTheDocument();
  });

  it("accepts an overridden title", () => {
    render(
      <RLGrammarInputCard
        value=""
        onChange={vi.fn()}
        titleKey="custom.key"
        titleFallback="Your grammar"
      />,
    );

    expect(screen.getByText("Your grammar")).toBeInTheDocument();
  });

  it("stays quiet while the editor is empty", () => {
    const { container } = render(
      <RLGrammarInputCard value="   " onChange={vi.fn()} />,
    );

    expect(container.querySelector(".bg-amber-500\\/10")).toBeNull();
  });

  it("shows a parse error for an unusable grammar", () => {
    const { container } = render(
      <RLGrammarInputCard value="???" onChange={vi.fn()} />,
    );

    expect(container.querySelector(".bg-amber-500\\/10")).not.toBeNull();
  });

  it("shows no error for a valid grammar", () => {
    const { container } = render(
      <RLGrammarInputCard value={GRAMMAR} onChange={vi.fn()} />,
    );

    expect(container.querySelector(".bg-amber-500\\/10")).toBeNull();
  });

  it("renders extra content passed as children", () => {
    render(
      <RLGrammarInputCard value="" onChange={vi.fn()}>
        <p>extra panel</p>
      </RLGrammarInputCard>,
    );

    expect(screen.getByText("extra panel")).toBeInTheDocument();
  });
});

describe("RLGrammarToLanguage", () => {
  it("asks for a grammar while the editor is empty", () => {
    render(<RLGrammarToLanguage />);

    expect(screen.getByTestId("rl-grammar-to-language-source")).toHaveValue("");
  });

  it("enumerates the language of a typed grammar", () => {
    render(<RLGrammarToLanguage />);

    fireEvent.change(screen.getByTestId("rl-grammar-to-language-source"), {
      target: { value: GRAMMAR },
    });

    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.getByText("ab")).toBeInTheDocument();
  });

  it("seeds the editor from an example grammar", () => {
    render(<RLGrammarToLanguage initialGrammar={GRAMMAR} />);

    expect(screen.getByTestId("rl-grammar-to-language-source")).toHaveValue(
      GRAMMAR,
    );
  });

  it("adopts a newly seeded grammar without remounting", () => {
    const { rerender } = render(<RLGrammarToLanguage initialGrammar="" />);

    rerender(<RLGrammarToLanguage initialGrammar={GRAMMAR} />);

    expect(screen.getByTestId("rl-grammar-to-language-source")).toHaveValue(
      GRAMMAR,
    );
  });

  it("clears the editor when the reset version advances", () => {
    const { rerender } = render(
      <RLGrammarToLanguage initialGrammar={GRAMMAR} resetVersion={0} />,
    );

    rerender(<RLGrammarToLanguage initialGrammar={GRAMMAR} resetVersion={1} />);

    expect(screen.getByTestId("rl-grammar-to-language-source")).toHaveValue("");
  });

  it("honours the word-length limit", () => {
    render(<RLGrammarToLanguage initialGrammar={GRAMMAR} />);

    fireEvent.change(screen.getByLabelText(/Max word length/), {
      target: { value: "1" },
    });

    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.queryByText("ab")).not.toBeInTheDocument();
  });

  it("reports a language with no derivable words", () => {
    render(<RLGrammarToLanguage initialGrammar="S -> aS" />);

    expect(
      screen.getByText("No words derivable within the limits."),
    ).toBeInTheDocument();
  });
});

describe("RLLanguageToGrammar", () => {
  const LANGUAGE = 'L = {"ab", "aab"}';

  it("derives a grammar from an enumerated language", () => {
    render(<RLLanguageToGrammar initialSource={LANGUAGE} />);

    expect(screen.getByTestId("rl-language-to-grammar-source")).toHaveValue(
      LANGUAGE,
    );
    expect(screen.getByTestId("rl-grammar-mode-detailed")).toBeInTheDocument();
  });

  it("switches between the detailed and simplified grammar views", () => {
    const { container } = render(
      <RLLanguageToGrammar initialSource={LANGUAGE} />,
    );

    const detailed = container.textContent;
    fireEvent.click(screen.getByTestId("rl-grammar-mode-simplified"));

    expect(container.textContent).not.toBe(detailed);
  });

  it("handles a set-builder language", () => {
    render(<RLLanguageToGrammar initialSource="L = {a^n c b^m | n, m > 0}" />);

    expect(
      screen.getByTestId("rl-grammar-mode-simplified"),
    ).toBeInTheDocument();
  });

  it("reports an unparseable language definition", () => {
    // A caret with no exponent after it — the parser rejects it outright.
    render(<RLLanguageToGrammar initialSource="L = {a^ | n > 0}" />);

    expect(
      screen.getByText(/regular-languages\.languageErrors\.trailingCaret/),
    ).toBeInTheDocument();
    // No grammar is produced, so the output panel has nothing to print.
    expect(screen.queryByText(/^N:$/)).not.toBeInTheDocument();
  });

  it("clears the editor when the reset version advances", () => {
    const { rerender } = render(
      <RLLanguageToGrammar initialSource={LANGUAGE} resetVersion={0} />,
    );

    rerender(<RLLanguageToGrammar initialSource={LANGUAGE} resetVersion={1} />);

    expect(screen.getByTestId("rl-language-to-grammar-source")).toHaveValue("");
  });
});

describe("RLWordRecognizer", () => {
  function testWordField() {
    return screen.getByPlaceholderText("Comma-separated words; empty = ε");
  }

  it("asks for a grammar before it can decide anything", () => {
    render(<RLWordRecognizer />);

    expect(
      screen.getByText("Enter a valid right-linear grammar."),
    ).toBeInTheDocument();
  });

  it("accepts a word the grammar derives", () => {
    render(<RLWordRecognizer initialGrammar={GRAMMAR} initialWord="ab" />);

    expect(screen.getByText("ab")).toBeInTheDocument();
    expect(
      screen.getByText("regular-languages.simulator.reason.accepted"),
    ).toBeInTheDocument();
  });

  it("checks several comma-separated words at once", () => {
    render(<RLWordRecognizer initialGrammar={GRAMMAR} initialWord="b, ba" />);

    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.getByText("ba")).toBeInTheDocument();
  });

  it("renders an empty piece as ε", () => {
    render(<RLWordRecognizer initialGrammar={GRAMMAR} initialWord="" />);

    expect(screen.getByText("ε")).toBeInTheDocument();
  });

  it("re-checks when the word is edited", () => {
    render(<RLWordRecognizer initialGrammar={GRAMMAR} initialWord="b" />);

    fireEvent.change(testWordField(), { target: { value: "aab" } });

    expect(screen.getByText("aab")).toBeInTheDocument();
  });

  it("adopts a newly seeded word without remounting", () => {
    const { rerender } = render(
      <RLWordRecognizer initialGrammar={GRAMMAR} initialWord="b" />,
    );

    rerender(<RLWordRecognizer initialGrammar={GRAMMAR} initialWord="aab" />);

    expect(testWordField()).toHaveValue("aab");
  });

  it("clears both fields when the reset version advances", () => {
    const { rerender } = render(
      <RLWordRecognizer
        initialGrammar={GRAMMAR}
        initialWord="b"
        resetVersion={0}
      />,
    );

    rerender(
      <RLWordRecognizer
        initialGrammar={GRAMMAR}
        initialWord="b"
        resetVersion={1}
      />,
    );

    expect(testWordField()).toHaveValue("");
    expect(screen.getByTestId("rl-word-recognizer-source")).toHaveValue("");
  });
});

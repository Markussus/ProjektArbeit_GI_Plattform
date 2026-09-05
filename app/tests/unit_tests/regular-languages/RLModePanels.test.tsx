/** @vitest-environment jsdom */

import { createRef } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RLGrammarModePanel,
  RLLanguageModePanel,
  RLRecognizeModePanel,
} from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/presentation/RLModePanels";
import {
  RLSimulator,
  type RLSimulatorHandle,
} from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/RLSimulator";
import { rlExamples } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/config/rlExamples";
import { rlExercises } from "@/pages/FundamentalsCS/RegularLanguages/exercises/rlExerciseDefinitions";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

const grammarExercise = rlExercises.find(
  (e) => e.mode === "grammarToLanguage",
)!;
const languageExercise = rlExercises.find(
  (e) => e.mode === "languageToGrammar" && e.referenceGrammar,
)!;
const grammarExample = rlExamples.find(
  (e) => e.mode === "grammarToLanguage" && e.grammarSource,
)!;
const languageExample = rlExamples.find(
  (e) => e.mode === "languageToGrammar" && e.languageSource,
)!;
const recognizeExample = rlExamples.find((e) => e.mode === "recognizeWord")!;

const panelProps = {
  resetVersion: 0,
  studentDraft: "",
  onStudentDraftChange: vi.fn(),
};

/** The wrapper a mode panel hides itself with. */
function panelOf(container: HTMLElement) {
  return container.firstElementChild as HTMLElement;
}

afterEach(() => cleanup());

describe("RLGrammarModePanel", () => {
  it("is hidden while another mode is active", () => {
    const { container } = render(
      <RLGrammarModePanel {...panelProps} mode="recognizeWord" />,
    );

    expect(panelOf(container).hidden).toBe(true);
  });

  it("shows the free-mode converter when no exercise is open", () => {
    render(<RLGrammarModePanel {...panelProps} mode="grammarToLanguage" />);

    expect(
      screen.getByTestId("rl-grammar-to-language-source"),
    ).toBeInTheDocument();
  });

  it("seeds the converter from the example grammar", () => {
    render(
      <RLGrammarModePanel
        {...panelProps}
        mode="grammarToLanguage"
        example={grammarExample}
      />,
    );

    expect(screen.getByTestId("rl-grammar-to-language-source")).toHaveValue(
      grammarExample.grammarSource,
    );
  });

  it("withholds the example seed while the panel is inactive", () => {
    render(
      <RLGrammarModePanel
        {...panelProps}
        mode="recognizeWord"
        example={grammarExample}
      />,
    );

    expect(screen.getByTestId("rl-grammar-to-language-source")).toHaveValue("");
  });

  it("shows the enumeration exercise when one is open", () => {
    render(
      <RLGrammarModePanel
        {...panelProps}
        mode="grammarToLanguage"
        exercise={grammarExercise}
      />,
    );

    expect(screen.getByTestId("rl-g2l-enumeration-input")).toBeInTheDocument();
  });

  it("ignores an exercise that belongs to another mode", () => {
    render(
      <RLGrammarModePanel
        {...panelProps}
        mode="grammarToLanguage"
        exercise={languageExercise}
      />,
    );

    expect(
      screen.getByTestId("rl-grammar-to-language-source"),
    ).toBeInTheDocument();
  });
});

describe("RLLanguageModePanel", () => {
  it("is hidden while another mode is active", () => {
    const { container } = render(
      <RLLanguageModePanel {...panelProps} mode="grammarToLanguage" />,
    );

    expect(panelOf(container).hidden).toBe(true);
  });

  it("seeds the converter from the example language", () => {
    render(
      <RLLanguageModePanel
        {...panelProps}
        mode="languageToGrammar"
        example={languageExample}
      />,
    );

    expect(screen.getByTestId("rl-language-to-grammar-source")).toHaveValue(
      languageExample.languageSource,
    );
  });

  it("shows the language exercise when one is open", () => {
    render(
      <RLLanguageModePanel
        {...panelProps}
        mode="languageToGrammar"
        exercise={languageExercise}
      />,
    );

    expect(
      screen.queryByTestId("rl-language-to-grammar-source"),
    ).not.toBeInTheDocument();
  });

  it("ignores an exercise that belongs to another mode", () => {
    render(
      <RLLanguageModePanel
        {...panelProps}
        mode="languageToGrammar"
        exercise={grammarExercise}
      />,
    );

    expect(
      screen.getByTestId("rl-language-to-grammar-source"),
    ).toBeInTheDocument();
  });
});

describe("RLRecognizeModePanel", () => {
  it("is hidden while another mode is active", () => {
    const { container } = render(
      <RLRecognizeModePanel mode="grammarToLanguage" resetVersion={0} />,
    );

    expect(panelOf(container).hidden).toBe(true);
  });

  it("seeds the grammar and test word from the example", () => {
    render(
      <RLRecognizeModePanel
        mode="recognizeWord"
        resetVersion={0}
        example={recognizeExample}
      />,
    );

    expect(screen.getByTestId("rl-word-recognizer-source")).toHaveValue(
      recognizeExample.grammarSource,
    );
  });

  it("stays blank while inactive", () => {
    render(
      <RLRecognizeModePanel
        mode="languageToGrammar"
        resetVersion={0}
        example={recognizeExample}
      />,
    );

    expect(screen.getByTestId("rl-word-recognizer-source")).toHaveValue("");
  });
});

describe("RLSimulator", () => {
  function renderSimulator(
    props: Partial<Parameters<typeof RLSimulator>[0]> = {},
  ) {
    const ref = createRef<RLSimulatorHandle>();
    render(<RLSimulator ref={ref} {...props} />);
    return ref;
  }

  it("opens in grammar → language mode by default", () => {
    renderSimulator();

    expect(screen.getByTestId("rl-mode-tab-grammarToLanguage")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("opens in the mode of the selected exercise", () => {
    renderSimulator({ exercise: languageExercise });

    expect(screen.getByTestId("rl-mode-tab-languageToGrammar")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("leaves an open exercise when the mode is switched by hand", () => {
    const onExitExercise = vi.fn();
    renderSimulator({ exercise: grammarExercise, onExitExercise });

    fireEvent.click(screen.getByTestId("rl-mode-tab-recognizeWord"));

    expect(onExitExercise).toHaveBeenCalledTimes(1);
  });

  it("does not report an exit when the active mode is re-selected", () => {
    const onExitExercise = vi.fn();
    renderSimulator({ exercise: grammarExercise, onExitExercise });

    fireEvent.click(screen.getByTestId("rl-mode-tab-grammarToLanguage"));

    expect(onExitExercise).not.toHaveBeenCalled();
  });

  it("returns null from checkSolution without an exercise", () => {
    const ref = renderSimulator();

    expect(ref.current!.checkSolution()).toBeNull();
  });

  it("grades the revealed solution of an exercise as a match", () => {
    const ref = renderSimulator({ exercise: grammarExercise });

    act(() => ref.current!.loadSolution());

    expect(ref.current!.checkSolution()).toMatchObject({ status: "match" });
  });

  it("clears the student's draft when an exercise is reset", () => {
    const ref = renderSimulator({ exercise: grammarExercise });

    act(() => ref.current!.loadSolution());
    act(() => ref.current!.resetStoredState());

    expect(ref.current!.checkSolution()).toMatchObject({ status: "invalid" });
  });

  it("resets free mode without touching an exercise draft", () => {
    const ref = renderSimulator();

    act(() => ref.current!.resetStoredState());

    expect(ref.current!.checkSolution()).toBeNull();
  });
});

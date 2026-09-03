/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DnfExerciseWorkspace } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/presentation/DnfExerciseWorkspace";
import { generateTruthTable } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";
import { parseBooleanExpression } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfParser";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

describe("DnfExerciseWorkspace", () => {
  afterEach(() => {
    cleanup();
  });

  const parsed = parseBooleanExpression("a & b");
  if (!parsed.ok) throw new Error("parse failed");
  const truthTable = generateTruthTable(parsed.expression);

  it("renders task, truth table and answer fields", () => {
    const handleTruthTableAnswer = vi.fn();
    const handleDnfAnswer = vi.fn();
    const handleCheck = vi.fn();
    const handleToggleSolution = vi.fn();

    render(
      <DnfExerciseWorkspace
        source="a & b"
        truthTable={truthTable}
        truthTableAnswers={[null, null, null, null]}
        dnfAnswer=""
        feedback={null}
        showSolution={false}
        requiresTruthTableAnswers={true}
        onTruthTableAnswerChange={handleTruthTableAnswer}
        onDnfAnswerChange={handleDnfAnswer}
        onCheck={handleCheck}
        onToggleSolution={handleToggleSolution}
      />,
    );

    expect(screen.getByTestId("dnf-exercise-workspace")).toBeInTheDocument();
    expect(screen.getByTestId("dnf-exercise-truth-table")).toBeInTheDocument();

    const resultBtn = screen.getByTestId("dnf-result-button-0-1");
    fireEvent.click(resultBtn);
    expect(handleTruthTableAnswer).toHaveBeenCalledWith(0, true);

    const checkBtn = screen.getByTestId("dnf-check-answer");
    fireEvent.click(checkBtn);
    expect(handleCheck).toHaveBeenCalled();
  });

  it("handles keyboard navigation on truth table result group", () => {
    const handleTruthTableAnswer = vi.fn();

    render(
      <DnfExerciseWorkspace
        source="a & b"
        truthTable={truthTable}
        truthTableAnswers={[null, null, null, null]}
        dnfAnswer=""
        feedback={null}
        showSolution={false}
        requiresTruthTableAnswers={true}
        onTruthTableAnswerChange={handleTruthTableAnswer}
        onDnfAnswerChange={vi.fn()}
        onCheck={vi.fn()}
        onToggleSolution={vi.fn()}
      />,
    );

    const resultGroups = screen.getAllByRole("group");
    const firstGroup = resultGroups[0];

    fireEvent.keyDown(firstGroup, { key: "1" });
    expect(handleTruthTableAnswer).toHaveBeenCalledWith(0, true);

    fireEvent.keyDown(firstGroup, { key: "0" });
    expect(handleTruthTableAnswer).toHaveBeenCalledWith(0, false);

    fireEvent.keyDown(firstGroup, { key: "ArrowDown" });
    fireEvent.keyDown(firstGroup, { key: "ArrowUp" });
  });
});

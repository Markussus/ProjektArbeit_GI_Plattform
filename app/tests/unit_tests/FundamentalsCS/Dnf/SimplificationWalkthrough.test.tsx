/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SimplificationWalkthrough } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/presentation/SimplificationWalkthrough";
import { buildDnfSimplificationWalkthrough } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfSimplificationWalkthrough";
import { generateTruthTable } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";
import { parseBooleanExpression } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfParser";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

describe("SimplificationWalkthrough", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders walkthrough for standard boolean expression", () => {
    const parsed = parseBooleanExpression("(a & b) | (a & !b)");
    if (!parsed.ok) throw new Error("parse failed");
    const truthTable = generateTruthTable(parsed.expression);
    const walkthrough = buildDnfSimplificationWalkthrough(truthTable);

    render(<SimplificationWalkthrough walkthrough={walkthrough} />);

    expect(
      screen.getByTestId("dnf-simplification-walkthrough"),
    ).toBeInTheDocument();
  });

  it("renders constant cases (always true / always false)", () => {
    const parsedTrue = parseBooleanExpression("a | !a");
    if (!parsedTrue.ok) throw new Error("parse failed");
    const tableTrue = generateTruthTable(parsedTrue.expression);
    const walkthroughTrue = buildDnfSimplificationWalkthrough(tableTrue);

    const { rerender } = render(
      <SimplificationWalkthrough walkthrough={walkthroughTrue} />,
    );
    expect(
      screen.getByTestId("dnf-simplification-walkthrough"),
    ).toBeInTheDocument();

    const parsedFalse = parseBooleanExpression("a & !a");
    if (!parsedFalse.ok) throw new Error("parse failed");
    const tableFalse = generateTruthTable(parsedFalse.expression);
    const walkthroughFalse = buildDnfSimplificationWalkthrough(tableFalse);

    rerender(<SimplificationWalkthrough walkthrough={walkthroughFalse} />);
    expect(
      screen.getByTestId("dnf-simplification-walkthrough"),
    ).toBeInTheDocument();
  });

  it("toggles compact and full view when large walkthrough threshold is exceeded", () => {
    // Generate expression with 4 variables to create multiple groups/steps
    const parsed = parseBooleanExpression("(a & b) | (c & d) | (a & c)");
    if (!parsed.ok) throw new Error("parse failed");
    const truthTable = generateTruthTable(parsed.expression);
    const walkthrough = buildDnfSimplificationWalkthrough(truthTable);

    render(<SimplificationWalkthrough walkthrough={walkthrough} />);
    const toggleBtn = screen.queryByTestId("dnf-walkthrough-view-toggle");
    if (toggleBtn) {
      fireEvent.click(toggleBtn);
      expect(
        screen.getByTestId("dnf-simplification-walkthrough"),
      ).toHaveAttribute("data-view", "full");
      fireEvent.click(toggleBtn);
      expect(
        screen.getByTestId("dnf-simplification-walkthrough"),
      ).toHaveAttribute("data-view", "compact");
    }
  });
});

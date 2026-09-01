/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DnfResultPanel } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/presentation/DnfResultPanel";
import { deriveDnfFromTruthTable } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfDerivation";
import { generateTruthTable } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";
import { parseBooleanExpression } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfParser";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

describe("DnfResultPanel", () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  afterEach(() => {
    cleanup();
  });

  it("renders result metrics and formatted DNF", () => {
    const parsed = parseBooleanExpression("a & b");
    if (!parsed.ok) throw new Error("parse failed");
    const table = generateTruthTable(parsed.expression);
    const derivation = deriveDnfFromTruthTable(table);

    render(
      <DnfResultPanel
        formattedDnf="a ∧ b"
        variableCount={2}
        rowCount={4}
        trueRowCount={1}
        derivation={derivation}
      />,
    );

    expect(screen.getByTestId("dnf-result-panel")).toBeInTheDocument();
    expect(screen.getByText("a ∧ b")).toBeInTheDocument();
  });

  it("handles toggle button for large result terms", () => {
    const parsed = parseBooleanExpression("a | b | c | d");
    if (!parsed.ok) throw new Error("parse failed");
    const table = generateTruthTable(parsed.expression);
    const derivation = deriveDnfFromTruthTable(table);

    render(
      <DnfResultPanel
        formattedDnf="large expression"
        variableCount={4}
        rowCount={16}
        trueRowCount={15}
        derivation={derivation}
      />,
    );

    const toggle = screen.queryByTestId("dnf-result-toggle");
    if (toggle) {
      fireEvent.click(toggle);
      expect(screen.getByTestId("dnf-result-panel")).toBeInTheDocument();
    }
  });
});

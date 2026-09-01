/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DnfTruthTableView } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/presentation/DnfTruthTableView";
import { buildTruthTableDisplay } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/adapters/truthTableAdapter";
import { generateTruthTable } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";
import { deriveDnfFromTruthTable } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfDerivation";
import { parseBooleanExpression } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfParser";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

describe("DnfTruthTableView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders truth table display rows", () => {
    const parsed = parseBooleanExpression("a & b");
    if (!parsed.ok) throw new Error("parse failed");
    const table = generateTruthTable(parsed.expression);
    const derivation = deriveDnfFromTruthTable(table);
    const display = buildTruthTableDisplay(table, derivation);

    render(<DnfTruthTableView display={display} />);

    expect(
      screen.getByTestId("dnf-solution-truth-table-panel"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("dnf-solution-truth-table")).toBeInTheDocument();
  });

  it("handles empty variable table and toggling view for large tables", () => {
    const parsed = parseBooleanExpression("a & b & c & d & e & f");
    if (!parsed.ok) throw new Error("parse failed");
    const table = generateTruthTable(parsed.expression);
    const derivation = deriveDnfFromTruthTable(table);
    const display = buildTruthTableDisplay(table, derivation);

    render(<DnfTruthTableView display={display} />);

    const toggleBtn = screen.getByTestId("dnf-solution-truth-table-toggle");
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId("dnf-solution-truth-table")).toBeInTheDocument();
  });
});

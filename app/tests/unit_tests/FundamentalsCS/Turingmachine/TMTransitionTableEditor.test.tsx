/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TMTransitionTableEditor } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/presentation/TMTransitionTableEditor";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("TMTransitionTableEditor", () => {
  afterEach(() => {
    cleanup();
  });

  const defaultHeaders = ["Symbol", "q0", "q1"];
  const defaultRows = [
    ["0", "(q1, 1, R)", "(q0, 0, L)"],
    ["1", "(q0, 0, R)", "(q1, 1, R)"],
  ];

  it("renders editor container and table visual with headers and cells", () => {
    const onCellChange = vi.fn();
    const onCellBlur = vi.fn();
    const onHeaderChange = vi.fn();
    const onAddRow = vi.fn();
    const onRemoveRow = vi.fn();
    const onAddColumn = vi.fn();
    const onRemoveColumn = vi.fn();

    render(
      <TMTransitionTableEditor
        headers={defaultHeaders}
        rows={defaultRows}
        onCellChange={onCellChange}
        onCellBlur={onCellBlur}
        onHeaderChange={onHeaderChange}
        onAddRow={onAddRow}
        onRemoveRow={onRemoveRow}
        onAddColumn={onAddColumn}
        onRemoveColumn={onRemoveColumn}
      />,
    );

    expect(
      screen.getByTestId("tm-transition-table-editor"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("tm-transition-table-header"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "turing-machine.config.transitionTable.transitionHintLine1",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "turing-machine.config.transitionTable.transitionHintLine2",
      ),
    ).toBeInTheDocument();
  });

  it("respects disabled prop", () => {
    render(
      <TMTransitionTableEditor
        headers={defaultHeaders}
        rows={defaultRows}
        onCellChange={vi.fn()}
        onCellBlur={vi.fn()}
        onHeaderChange={vi.fn()}
        onAddRow={vi.fn()}
        onRemoveRow={vi.fn()}
        onAddColumn={vi.fn()}
        onRemoveColumn={vi.fn()}
        disabled={true}
      />,
    );

    expect(
      screen.getByTestId("tm-transition-table-editor"),
    ).toBeInTheDocument();
  });
});

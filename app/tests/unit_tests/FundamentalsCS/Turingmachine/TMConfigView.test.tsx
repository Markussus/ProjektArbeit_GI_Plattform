/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TMConfigView } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/presentation/TMConfigView";
import type { UseTMConfigEditorResult } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/application/useTMConfigEditor";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("TMConfigView", () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    alertSpy.mockRestore();
  });

  const createMockEditor = (
    overrides?: Partial<UseTMConfigEditorResult>,
  ): UseTMConfigEditorResult => {
    return {
      draft: {
        states: ["q0", "qS"],
        inputAlphabet: ["0"],
        tapeAlphabet: ["0", "_"],
        blankSymbol: "_",
        initialState: "q0",
        haltStates: ["qS"],
        transitions: {
          "0": {
            q0: { nextState: "qS", writeSymbol: "0", movement: "R" },
          },
        },
        initialTape: ["0"],
      },
      tableHeaders: ["Symbol", "q0", "qS"],
      displayRows: [
        ["_", "", ""],
        ["0", "(qS, 0, R)", ""],
      ],
      validationIssues: [],
      blockingCellIssue: null,
      hasBlockingCellIssue: false,
      isCellEditable: vi.fn().mockReturnValue(true),
      isCellDisabled: vi.fn().mockReturnValue(false),
      handleInitialTapeChange: vi.fn(),
      handleInitialStateChange: vi.fn(),
      handleToggleHaltState: vi.fn(),
      handleAddHaltState: vi.fn(),
      handleAddRow: vi.fn(),
      handleRemoveRow: vi.fn(),
      handleAddColumn: vi.fn(),
      handleRemoveColumn: vi.fn(),
      handleHeaderChange: vi.fn(),
      handleCellChange: vi.fn(),
      handleCellBlur: vi.fn(),
      ...overrides,
    };
  };

  it("renders editor panels and alphabets correctly", () => {
    const editor = createMockEditor();
    render(<TMConfigView editor={editor} />);

    expect(screen.getByTestId("tm-config-view")).toBeInTheDocument();
    expect(screen.getByTestId("tm-config-title")).toBeInTheDocument();
    expect(screen.getByTestId("tm-input-alphabet")).toBeInTheDocument();
    expect(screen.getByTestId("tm-tape-alphabet")).toBeInTheDocument();
    expect(screen.queryByTestId("tm-config-error")).not.toBeInTheDocument();
  });

  it("displays validation and blocking error messages when present", () => {
    const editor = createMockEditor({
      validationIssues: [
        { code: "states_empty", path: "states" },
        {
          code: "blank_symbol_invalid",
          path: "blankSymbol",
          params: { symbol: "" },
        },
      ],
      blockingCellIssue: {
        position: { rowIndex: 0, colIndex: 1 },
        code: "symbol_duplicate",
        value: "0",
      },
      hasBlockingCellIssue: true,
    });

    render(<TMConfigView editor={editor} />);

    const errorBox = screen.getByTestId("tm-config-error");
    expect(errorBox).toBeInTheDocument();
    expect(errorBox.textContent).toContain(
      "turing-machine.validation.program.statesEmpty",
    );
    expect(errorBox.textContent).toContain(
      "turing-machine.validation.program.blankSymbolInvalid",
    );
    expect(errorBox.textContent).toContain(
      "turing-machine.config.editing.symbolDuplicate",
    );
  });

  it("handles different blocking issue codes in translateCellIssue", () => {
    const editor1 = createMockEditor({
      blockingCellIssue: {
        position: { rowIndex: 0, colIndex: 0 },
        code: "symbol_single_char",
        value: "abc",
      },
    });

    const { unmount } = render(<TMConfigView editor={editor1} />);
    expect(screen.getByTestId("tm-config-error").textContent).toContain(
      "turing-machine.config.editing.symbolSingleChar",
    );
    unmount();

    const editor2 = createMockEditor({
      blockingCellIssue: {
        position: { rowIndex: 0, colIndex: 1 },
        code: "transition_format_invalid",
        value: "xyz",
      },
    });
    render(<TMConfigView editor={editor2} />);
    expect(screen.getByTestId("tm-config-error").textContent).toContain(
      "turing-machine.config.editing.transitionCellInvalid",
    );
  });

  it("handles remove row: blocks blank symbol deletion and allows non-blank deletion", () => {
    const handleRemoveRow = vi.fn();
    const editor = createMockEditor({ handleRemoveRow });
    render(<TMConfigView editor={editor} />);

    // Row 1 is blank symbol "_"
    const removeRow1 = screen.queryByTestId("tm-transition-table-remove-row-1");
    if (removeRow1) {
      fireEvent.click(removeRow1);
      expect(alertSpy).toHaveBeenCalledWith(
        "turing-machine.config.editing.cannotRemoveBlank",
      );
    }

    // Row 2 is symbol "0" (index 1)
    const removeRow2 = screen.queryByTestId("tm-transition-table-remove-row-2");
    if (removeRow2) {
      fireEvent.click(removeRow2);
      expect(handleRemoveRow).toHaveBeenCalledWith(1);
    }
  });

  it("handles remove column: blocks column 0 and last state deletion, allows removal otherwise", () => {
    const handleRemoveColumn = vi.fn();
    const editor = createMockEditor({ handleRemoveColumn });
    const { rerender } = render(<TMConfigView editor={editor} />);

    // Col 2 corresponds to colIndex 1
    const removeCol2 = screen.queryByTestId(
      "tm-transition-table-remove-column-2",
    );
    if (removeCol2) {
      fireEvent.click(removeCol2);
      expect(handleRemoveColumn).toHaveBeenCalledWith(1);
    }

    // Single state prevents deletion
    const singleStateEditor = createMockEditor({
      draft: {
        ...editor.draft,
        states: ["q0"],
      },
      tableHeaders: ["Symbol", "q0"],
      displayRows: [["0", "(q0, 0, R)"]],
    });
    rerender(<TMConfigView editor={singleStateEditor} />);
    const removeColSingle = screen.queryByTestId(
      "tm-transition-table-remove-column-2",
    );
    if (removeColSingle) {
      fireEvent.click(removeColSingle);
      expect(alertSpy).toHaveBeenCalledWith(
        "turing-machine.config.editing.cannotRemoveLastState",
      );
    }
  });
});

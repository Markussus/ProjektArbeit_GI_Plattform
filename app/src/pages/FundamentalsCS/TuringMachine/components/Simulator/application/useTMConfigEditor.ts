import { useCallback, useMemo, useReducer, useState } from "react";
import {
  buildTransitionTableHeaders,
  buildTransitionTableRows,
  getOrderedTapeAlphabet,
} from "../adapters/tmTableAdapter";
import type { TMProgram } from "../domain/tmProgram";
import {
  validateTMProgram,
  type TMProgramIssue,
} from "../domain/tmProgramValidation";
import { parseTransition } from "../utils/tmParsing";
import { isSingleTapeSymbol } from "../utils/tmSymbolValidation";
import {
  createProgramDraft,
  tmEditorReducer,
  type TMEditorAction,
} from "./tmEditorReducer";

export interface TMTablePosition {
  row: number;
  col: number;
}

export type TMEditorCellIssueCode =
  | "symbol_single_char"
  | "symbol_duplicate"
  | "transition_invalid";

export interface TMEditorCellIssue {
  code: TMEditorCellIssueCode;
  position: TMTablePosition;
}

export type ApplyTMProgramResult =
  | { ok: true; program: TMProgram }
  | { ok: false };

export interface UseTMConfigEditorResult {
  draft: TMProgram;
  tableHeaders: string[];
  displayRows: string[][];
  validationIssues: TMProgramIssue[];
  blockingCellIssue: TMEditorCellIssue | null;
  hasBlockingCellIssue: boolean;
  handleInitialTapeChange: (value: string) => void;
  handleInitialStateChange: (state: string) => void;
  handleToggleHaltState: (state: string, isHalting: boolean) => void;
  handleCellChange: (rowIndex: number, colIndex: number, value: string) => void;
  handleCellBlur: (rowIndex: number, colIndex: number) => void;
  handleHeaderChange: (colIndex: number, value: string) => void;
  handleAddRow: () => void;
  handleRemoveRow: (rowIndex: number) => void;
  handleAddColumn: () => void;
  handleRemoveColumn: (colIndex: number) => void;
  isCellEditable: (rowIndex: number, colIndex: number) => boolean;
  isCellDisabled: (rowIndex: number, colIndex: number) => boolean;
  applyProgram: () => ApplyTMProgramResult;
  resetToProgram: (program: TMProgram) => void;
}

export function useTMConfigEditor(
  initialProgram: TMProgram,
): UseTMConfigEditorResult {
  const [draft, dispatch] = useReducer(
    tmEditorReducer,
    initialProgram,
    createProgramDraft,
  );
  const [cellDrafts, setCellDrafts] = useState<Record<string, string>>({});
  const [validationIssues, setValidationIssues] = useState<TMProgramIssue[]>(
    [],
  );
  const [blockingCellIssue, setBlockingCellIssue] =
    useState<TMEditorCellIssue | null>(null);

  const orderedTapeAlphabet = useMemo(
    () => getOrderedTapeAlphabet(draft),
    [draft],
  );
  const tableHeaders = useMemo(
    () => buildTransitionTableHeaders(draft.states),
    [draft.states],
  );
  const committedRows = useMemo(() => buildTransitionTableRows(draft), [draft]);
  const displayRows = useMemo(() => {
    return committedRows.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const draftKey = getCellKey(rowIndex, colIndex);
        return cellDrafts[draftKey] ?? cell;
      }),
    );
  }, [cellDrafts, committedRows]);

  const dispatchEditorAction = useCallback((action: TMEditorAction) => {
    dispatch(action);
    setValidationIssues([]);
  }, []);

  const resetToProgram = useCallback((program: TMProgram) => {
    dispatch({ type: "replace_program", program });
    setCellDrafts({});
    setValidationIssues([]);
    setBlockingCellIssue(null);
  }, []);

  const handleInitialTapeChange = useCallback(
    (value: string) => {
      dispatchEditorAction({ type: "set_initial_tape", value });
    },
    [dispatchEditorAction],
  );

  const handleInitialStateChange = useCallback(
    (state: string) => {
      dispatchEditorAction({ type: "set_initial_state", state });
    },
    [dispatchEditorAction],
  );

  const handleToggleHaltState = useCallback(
    (state: string, isHalting: boolean) => {
      dispatchEditorAction({
        type: "toggle_halt_state",
        state,
        isHalting,
      });
    },
    [dispatchEditorAction],
  );

  const handleCellChange = useCallback(
    (rowIndex: number, colIndex: number, value: string) => {
      if (
        blockingCellIssue &&
        !isSamePosition(blockingCellIssue.position, {
          row: rowIndex,
          col: colIndex,
        })
      ) {
        return;
      }

      setCellDrafts((currentDrafts) => ({
        ...currentDrafts,
        [getCellKey(rowIndex, colIndex)]: value,
      }));
    },
    [blockingCellIssue],
  );

  const handleCellBlur = useCallback(
    (rowIndex: number, colIndex: number) => {
      const draftKey = getCellKey(rowIndex, colIndex);
      const value =
        cellDrafts[draftKey] ?? committedRows[rowIndex]?.[colIndex] ?? "";
      const issue = validateTransitionTableCell(
        draft,
        orderedTapeAlphabet,
        rowIndex,
        colIndex,
        value,
      );

      if (issue) {
        setBlockingCellIssue(issue);
        return;
      }

      const currentValue = committedRows[rowIndex]?.[colIndex] ?? "";
      if (value !== currentValue) {
        commitCellChange(
          dispatchEditorAction,
          draft,
          orderedTapeAlphabet,
          rowIndex,
          colIndex,
          value,
        );
      }

      setCellDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[draftKey];
        return nextDrafts;
      });

      if (
        blockingCellIssue &&
        isSamePosition(blockingCellIssue.position, {
          row: rowIndex,
          col: colIndex,
        })
      ) {
        setBlockingCellIssue(null);
      }
    },
    [
      blockingCellIssue,
      cellDrafts,
      committedRows,
      dispatchEditorAction,
      draft,
      orderedTapeAlphabet,
    ],
  );

  const handleHeaderChange = useCallback(
    (colIndex: number, value: string) => {
      if (colIndex === 0) {
        return;
      }

      const currentState = draft.states[colIndex - 1];
      const nextState = value.trim();

      if (
        !currentState ||
        nextState === "" ||
        (draft.states.includes(nextState) && nextState !== currentState)
      ) {
        return;
      }

      dispatchEditorAction({
        type: "rename_state",
        currentState,
        nextState,
      });
    },
    [dispatchEditorAction, draft.states],
  );

  const handleAddRow = useCallback(() => {
    dispatchEditorAction({ type: "add_tape_symbol" });
  }, [dispatchEditorAction]);

  const handleRemoveRow = useCallback(
    (rowIndex: number) => {
      const symbol = orderedTapeAlphabet[rowIndex];
      if (!symbol) {
        return;
      }

      dispatchEditorAction({
        type: "remove_tape_symbol",
        symbol,
      });
    },
    [dispatchEditorAction, orderedTapeAlphabet],
  );

  const handleAddColumn = useCallback(() => {
    dispatchEditorAction({ type: "add_state" });
  }, [dispatchEditorAction]);

  const handleRemoveColumn = useCallback(
    (colIndex: number) => {
      const state = draft.states[colIndex - 1];
      if (!state) {
        return;
      }

      dispatchEditorAction({
        type: "remove_state",
        state,
      });
    },
    [dispatchEditorAction, draft.states],
  );

  const isCellEditable = useCallback(
    (rowIndex: number, colIndex: number) => {
      return (
        !!blockingCellIssue &&
        isSamePosition(blockingCellIssue.position, {
          row: rowIndex,
          col: colIndex,
        })
      );
    },
    [blockingCellIssue],
  );

  const isCellDisabled = useCallback(
    (rowIndex: number, colIndex: number) => {
      if (
        colIndex === 0 &&
        orderedTapeAlphabet[rowIndex] === draft.blankSymbol
      ) {
        return true;
      }

      return (
        !!blockingCellIssue &&
        !isSamePosition(blockingCellIssue.position, {
          row: rowIndex,
          col: colIndex,
        })
      );
    },
    [blockingCellIssue, draft.blankSymbol, orderedTapeAlphabet],
  );

  const applyProgram = useCallback((): ApplyTMProgramResult => {
    if (blockingCellIssue) {
      return { ok: false };
    }

    const issues = validateTMProgram(draft);
    setValidationIssues(issues);

    if (issues.length > 0) {
      return { ok: false };
    }

    return {
      ok: true,
      program: createProgramDraft(draft),
    };
  }, [blockingCellIssue, draft]);

  return {
    draft,
    tableHeaders,
    displayRows,
    validationIssues,
    blockingCellIssue,
    hasBlockingCellIssue: blockingCellIssue !== null,
    handleInitialTapeChange,
    handleInitialStateChange,
    handleToggleHaltState,
    handleCellChange,
    handleCellBlur,
    handleHeaderChange,
    handleAddRow,
    handleRemoveRow,
    handleAddColumn,
    handleRemoveColumn,
    isCellEditable,
    isCellDisabled,
    applyProgram,
    resetToProgram,
  };
}

function commitCellChange(
  dispatch: (action: TMEditorAction) => void,
  draft: TMProgram,
  orderedTapeAlphabet: string[],
  rowIndex: number,
  colIndex: number,
  value: string,
): void {
  const symbol = orderedTapeAlphabet[rowIndex];
  if (!symbol) {
    return;
  }

  if (colIndex === 0) {
    dispatch({
      type: "rename_tape_symbol",
      currentSymbol: symbol,
      nextSymbol: value,
    });
    return;
  }

  const state = draft.states[colIndex - 1];
  if (!state) {
    return;
  }

  dispatch({
    type: "update_transition",
    readSymbol: symbol,
    currentState: state,
    transition: value.trim() === "" ? null : parseTransition(value),
  });
}

function validateTransitionTableCell(
  draft: TMProgram,
  orderedTapeAlphabet: string[],
  rowIndex: number,
  colIndex: number,
  value: string,
): TMEditorCellIssue | null {
  if (colIndex === 0) {
    const currentSymbol = orderedTapeAlphabet[rowIndex];

    if (!currentSymbol || currentSymbol === draft.blankSymbol) {
      return null;
    }

    if (!isSingleTapeSymbol(value)) {
      return {
        code: "symbol_single_char",
        position: { row: rowIndex, col: colIndex },
      };
    }

    if (draft.tapeAlphabet.includes(value) && value !== currentSymbol) {
      return {
        code: "symbol_duplicate",
        position: { row: rowIndex, col: colIndex },
      };
    }

    return null;
  }

  if (value.trim() === "") {
    return null;
  }

  if (!parseTransition(value)) {
    return {
      code: "transition_invalid",
      position: { row: rowIndex, col: colIndex },
    };
  }

  return null;
}

function getCellKey(rowIndex: number, colIndex: number): string {
  return `${rowIndex}:${colIndex}`;
}

function isSamePosition(
  left: TMTablePosition,
  right: TMTablePosition,
): boolean {
  return left.row === right.row && left.col === right.col;
}

import { useEffect, useMemo, useState } from "react";
import type { TablePosition } from "@/components/shared/TableVisual/TableView";
import { useTranslation } from "react-i18next";
import type { TMConfig } from "../types";
import { isSingleTapeSymbol } from "../utils/tmSymbolValidation";
import { parseTransition } from "../utils/tmParsing";
import {
  addState,
  addTapeSymbol,
  removeState,
  removeTapeSymbol,
  renameState,
  renameTapeSymbol,
  toggleHaltState,
  updateInitialState,
  updateInitialTape,
  updateTransitionCellValue,
} from "../model/tmConfigMutations";
import {
  buildTransitionTableHeaders,
  buildTransitionTableRows,
  getOrderedTapeAlphabet,
} from "../model/tmTable";
import {
  TMGeneralSettings,
  type TMGeneralSettingsProps,
} from "./TMGeneralSettings.tsx";
import {
  TMHaltStatesPanel,
  type TMHaltStatesPanelProps,
} from "./TMHaltStatesPanel.tsx";
import {
  TMTransitionTableEditor,
  type TMTransitionTableEditorProps,
} from "./TMTransitionTableEditor.tsx";

export interface TMConfigViewProps {
  config: TMConfig;
  onChange: (newConfig: TMConfig) => void;
  validationError?: string | null;
  onTableEditErrorChange?: (error: string | null) => void;
}

export function TMConfigView({
  config,
  onChange,
  validationError,
  onTableEditErrorChange,
}: TMConfigViewProps) {
  const { t } = useTranslation();
  const [cellDrafts, setCellDrafts] = useState<Record<string, string>>({});
  const [invalidCell, setInvalidCell] = useState<{
    position: TablePosition;
    message: string;
  } | null>(null);

  const orderedTapeAlphabet = getOrderedTapeAlphabet(config);
  const tableHeaders = useMemo(
    () => buildTransitionTableHeaders(config.states),
    [config.states],
  );
  const tableRows = useMemo(() => buildTransitionTableRows(config), [config]);
  const displayRows = useMemo(() => {
    return tableRows.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const draftKey = getCellKey(rowIndex, colIndex);
        return cellDrafts[draftKey] ?? cell;
      }),
    );
  }, [cellDrafts, tableRows]);
  const hasBlockingTableError = invalidCell !== null;
  const combinedError = [validationError, invalidCell?.message]
    .filter(Boolean)
    .join("\n\n");

  useEffect(() => {
    onTableEditErrorChange?.(invalidCell?.message ?? null);

    return () => {
      onTableEditErrorChange?.(null);
    };
  }, [invalidCell, onTableEditErrorChange]);

  const handleCellChange = (
    rowIndex: number,
    colIndex: number,
    value: string,
  ) => {
    if (
      hasBlockingTableError &&
      !isSamePosition(invalidCell?.position, { row: rowIndex, col: colIndex })
    ) {
      return;
    }

    setCellDrafts((currentDrafts) => ({
      ...currentDrafts,
      [getCellKey(rowIndex, colIndex)]: value,
    }));
  };

  const handleCellBlur = (rowIndex: number, colIndex: number) => {
    const draftKey = getCellKey(rowIndex, colIndex);
    const value = cellDrafts[draftKey] ?? tableRows[rowIndex]?.[colIndex] ?? "";
    const errorMessage = validateTransitionTableCell({
      config,
      orderedTapeAlphabet,
      rowIndex,
      colIndex,
      value,
      t,
    });

    if (errorMessage) {
      setInvalidCell({
        position: { row: rowIndex, col: colIndex },
        message: errorMessage,
      });
      return;
    }

    commitCellChange(rowIndex, colIndex, value);
    setCellDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[draftKey];
      return nextDrafts;
    });

    if (
      isSamePosition(invalidCell?.position, { row: rowIndex, col: colIndex })
    ) {
      setInvalidCell(null);
    }
  };

  const commitCellChange = (
    rowIndex: number,
    colIndex: number,
    value: string,
  ) => {
    const symbol = orderedTapeAlphabet[rowIndex];
    if (!symbol) {
      return;
    }

    const currentValue = tableRows[rowIndex]?.[colIndex] ?? "";
    if (value === currentValue) {
      return;
    }

    if (colIndex === 0) {
      onChange(renameTapeSymbol(config, symbol, value));
      return;
    }

    const state = config.states[colIndex - 1];
    if (!state) {
      return;
    }

    onChange(updateTransitionCellValue(config, symbol, state, value));
  };

  const handleRemoveRow = (rowIndex: number) => {
    const symbol = orderedTapeAlphabet[rowIndex];
    if (!symbol) {
      return;
    }

    if (symbol === config.blankSymbol) {
      alert(
        t("tm.config.cannotRemoveBlank", "The blank symbol cannot be removed."),
      );
      return;
    }

    onChange(removeTapeSymbol(config, symbol));
  };

  const handleRemoveColumn = (colIndex: number) => {
    if (colIndex === 0) {
      alert(
        t(
          "tm.config.cannotRemoveSymbolColumn",
          "The symbol column cannot be removed.",
        ),
      );
      return;
    }

    if (config.states.length <= 1) {
      alert(
        t(
          "tm.config.cannotRemoveLastState",
          "At least one state column must remain.",
        ),
      );
      return;
    }

    const stateToRemove = config.states[colIndex - 1];
    if (!stateToRemove) {
      return;
    }

    onChange(removeState(config, stateToRemove));
  };

  const handleHeaderChange = (colIndex: number, value: string) => {
    if (colIndex === 0) {
      return;
    }

    const currentState = config.states[colIndex - 1];
    const trimmedValue = value.trim();

    if (
      !currentState ||
      trimmedValue === "" ||
      (config.states.includes(trimmedValue) && trimmedValue !== currentState)
    ) {
      return;
    }

    onChange(renameState(config, currentState, value));
  };

  const generalSettingsProps: TMGeneralSettingsProps = {
    config,
    disabled: hasBlockingTableError,
    onInitialTapeChange: (value) => onChange(updateInitialTape(config, value)),
    onInitialStateChange: (state) =>
      onChange(updateInitialState(config, state)),
  };

  const transitionTableEditorProps: TMTransitionTableEditorProps = {
    headers: tableHeaders,
    rows: displayRows,
    onCellChange: handleCellChange,
    onCellBlur: handleCellBlur,
    onHeaderChange: handleHeaderChange,
    invalidCell: invalidCell?.position ?? null,
    isCellEditable: (rowIndex: number, colIndex: number) =>
      hasBlockingTableError &&
      isSamePosition(invalidCell?.position, {
        row: rowIndex,
        col: colIndex,
      }),
    isCellDisabled: (rowIndex: number, colIndex: number) => {
      if (
        colIndex === 0 &&
        orderedTapeAlphabet[rowIndex] === config.blankSymbol
      ) {
        return true;
      }

      return (
        hasBlockingTableError &&
        !isSamePosition(invalidCell?.position, {
          row: rowIndex,
          col: colIndex,
        })
      );
    },
    disabled: hasBlockingTableError,
    onAddRow: () => onChange(addTapeSymbol(config)),
    onRemoveRow: handleRemoveRow,
    onAddColumn: () => onChange(addState(config)),
    onRemoveColumn: handleRemoveColumn,
  };

  const haltStatesPanelProps: TMHaltStatesPanelProps = {
    states: config.states,
    initialState: config.initialState,
    haltStates: config.haltStates,
    disabled: hasBlockingTableError,
    onToggle: (state, isHalting) =>
      onChange(toggleHaltState(config, state, isHalting)),
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4">
      <div className="space-y-4">
        <h2 className="text-lg font-bold">
          {t("tm.config.title", "Turing Machine Configuration")}
        </h2>

        {combinedError && (
          <div className="bg-destructive/10 text-destructive rounded-md border border-current/20 p-3 text-sm whitespace-pre-line">
            {combinedError}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_12rem]">
          <TMGeneralSettings {...generalSettingsProps} />

          <TMTransitionTableEditor {...transitionTableEditorProps} />

          <TMHaltStatesPanel {...haltStatesPanelProps} />
        </div>
      </div>
    </div>
  );
}

function getCellKey(rowIndex: number, colIndex: number): string {
  return `${rowIndex}:${colIndex}`;
}

function isSamePosition(
  left: TablePosition | null | undefined,
  right: TablePosition,
): boolean {
  return left?.row === right.row && left?.col === right.col;
}

function validateTransitionTableCell({
  config,
  orderedTapeAlphabet,
  rowIndex,
  colIndex,
  value,
  t,
}: {
  config: TMConfig;
  orderedTapeAlphabet: string[];
  rowIndex: number;
  colIndex: number;
  value: string;
  t: (key: string, defaultValue: string) => string;
}): string | null {
  if (colIndex === 0) {
    const currentSymbol = orderedTapeAlphabet[rowIndex];
    if (!currentSymbol || currentSymbol === config.blankSymbol) {
      return null;
    }

    if (!isSingleTapeSymbol(value)) {
      return t(
        "tm.config.symbolSingleChar",
        "Tape symbols must consist of exactly one character.",
      );
    }

    if (config.tapeAlphabet.includes(value) && value !== currentSymbol) {
      return t(
        "tm.config.symbolDuplicate",
        "This tape symbol already exists in the transition table.",
      );
    }

    return null;
  }

  if (value.trim() === "") {
    return null;
  }

  if (!parseTransition(value)) {
    return t(
      "tm.config.transitionCellInvalid",
      "Transitions must use the format (Next State, Write Symbol, Movement) and the write symbol must be exactly one character.",
    );
  }

  return null;
}

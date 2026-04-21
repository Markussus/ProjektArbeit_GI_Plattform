import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { getOrderedTapeAlphabet } from "../adapters/tmTableAdapter";
import type {
  TMEditorCellIssueCode,
  UseTMConfigEditorResult,
} from "../application/useTMConfigEditor";
import type {
  TMProgramIssue,
  TMProgramIssueCode,
} from "../domain/tmProgramValidation";
import { TMGeneralSettings } from "./TMGeneralSettings";
import { TMHaltStatesPanel } from "./TMHaltStatesPanel";
import { TMTransitionTableEditor } from "./TMTransitionTableEditor";

export interface TMConfigViewProps {
  editor: UseTMConfigEditorResult;
}

export function TMConfigView({ editor }: TMConfigViewProps) {
  const { t } = useTranslation();
  const orderedTapeAlphabet = getOrderedTapeAlphabet(editor.draft);
  const combinedError = [
    ...editor.validationIssues.map((issue) => translateProgramIssue(t, issue)),
    editor.blockingCellIssue
      ? translateCellIssue(t, editor.blockingCellIssue.code)
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const handleRemoveRow = (rowIndex: number) => {
    const symbol = orderedTapeAlphabet[rowIndex];
    if (!symbol) {
      return;
    }

    if (symbol === editor.draft.blankSymbol) {
      alert(t("tm.config.cannotRemoveBlank"));
      return;
    }

    editor.handleRemoveRow(rowIndex);
  };

  const handleRemoveColumn = (colIndex: number) => {
    if (colIndex === 0) {
      alert(t("tm.config.cannotRemoveSymbolColumn"));
      return;
    }

    if (editor.draft.states.length <= 1) {
      alert(t("tm.config.cannotRemoveLastState"));
      return;
    }

    editor.handleRemoveColumn(colIndex);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-4 lg:mx-auto lg:w-max lg:max-w-full">
        <h2 className="text-lg font-bold">
          {t("tm.config.title")}
        </h2>

        {combinedError && (
          <div className="bg-destructive/10 text-destructive rounded-md border border-current/20 p-3 text-sm whitespace-pre-line">
            {combinedError}
          </div>
        )}

        <div className="mt-4 grid w-full grid-cols-1 gap-6 lg:grid-cols-[auto_12rem] lg:items-start">
          <TMGeneralSettings
            program={editor.draft}
            disabled={editor.hasBlockingCellIssue}
            onInitialTapeChange={editor.handleInitialTapeChange}
            onInitialStateChange={editor.handleInitialStateChange}
          />

          <TMTransitionTableEditor
            headers={editor.tableHeaders}
            rows={editor.displayRows}
            onCellChange={editor.handleCellChange}
            onCellBlur={editor.handleCellBlur}
            onHeaderChange={editor.handleHeaderChange}
            invalidCell={editor.blockingCellIssue?.position ?? null}
            isCellEditable={editor.isCellEditable}
            isCellDisabled={editor.isCellDisabled}
            disabled={editor.hasBlockingCellIssue}
            onAddRow={editor.handleAddRow}
            onRemoveRow={handleRemoveRow}
            onAddColumn={editor.handleAddColumn}
            onRemoveColumn={handleRemoveColumn}
          />

          <TMHaltStatesPanel
            states={editor.draft.states}
            initialState={editor.draft.initialState}
            haltStates={editor.draft.haltStates}
            disabled={editor.hasBlockingCellIssue}
            onToggle={editor.handleToggleHaltState}
          />
        </div>
      </div>
    </div>
  );
}

function translateCellIssue(t: TFunction, code: TMEditorCellIssueCode): string {
  if (code === "symbol_single_char") {
    return t("tm.config.symbolSingleChar");
  }

  if (code === "symbol_duplicate") {
    return t("tm.config.symbolDuplicate");
  }

  return t("tm.config.transitionCellInvalid");
}

function translateProgramIssue(t: TFunction, issue: TMProgramIssue): string {
  const keyByCode: Record<TMProgramIssueCode, string> = {
    states_empty: "tm.validation.statesEmpty",
    initial_state_missing: "tm.validation.initialStateMissing",
    halt_states_empty: "tm.validation.haltStatesEmpty",
    halt_state_missing: "tm.validation.haltStateMissing",
    blank_symbol_missing: "tm.validation.blankSymbolMissing",
    blank_symbol_invalid: "tm.validation.blankSymbolInvalid",
    tape_symbol_invalid: "tm.validation.tapeSymbolInvalid",
    initial_tape_invalid_symbol: "tm.validation.initialTapeInvalidSymbol",
    transition_read_symbol_missing: "tm.validation.transitionReadSymbolMissing",
    transition_read_symbol_invalid: "tm.validation.transitionReadSymbolInvalid",
    transition_state_missing: "tm.validation.transitionStateMissing",
    transition_next_state_missing: "tm.validation.transitionNextStateMissing",
    transition_write_symbol_missing:
      "tm.validation.transitionWriteSymbolMissing",
    transition_write_symbol_invalid:
      "tm.validation.transitionWriteSymbolInvalid",
  };

  return t(
    keyByCode[issue.code] as never,
    issue.params as never,
  ) as unknown as string;
}

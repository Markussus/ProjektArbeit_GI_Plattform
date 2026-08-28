import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { getOrderedTapeAlphabet } from "../adapters/tmTableAdapter";
import type {
  TMEditorCellIssueCode,
  UseTMConfigEditorResult,
} from "../application/useTMConfigEditor";
import { deriveTapeAlphabet } from "../domain/tmProgram";
import type {
  TMProgramIssue,
  TMProgramIssueCode,
} from "../domain/tmProgramValidation";
import { TMGeneralSettings } from "./TMGeneralSettings";
import { TMAlphabetPanel } from "./TMAlphabetPanel";
import { TMHaltStatesPanel } from "./TMHaltStatesPanel";
import { TMTransitionTableEditor } from "./TMTransitionTableEditor";

export interface TMConfigViewProps {
  editor: UseTMConfigEditorResult;
}

export function TMConfigView({ editor }: TMConfigViewProps) {
  const { t } = useTranslation();
  const orderedTapeAlphabet = getOrderedTapeAlphabet(editor.draft);
  const displayedTapeAlphabet = getOrderedTapeAlphabet({
    blankSymbol: editor.draft.blankSymbol,
    tapeAlphabet: deriveTapeAlphabet(editor.draft),
  });
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
      alert(t("turing-machine.config.editing.cannotRemoveBlank"));
      return;
    }

    editor.handleRemoveRow(rowIndex);
  };

  const handleRemoveColumn = (colIndex: number) => {
    if (colIndex === 0) {
      alert(t("turing-machine.config.editing.cannotRemoveSymbolColumn"));
      return;
    }

    if (editor.draft.states.length <= 1) {
      alert(t("turing-machine.config.editing.cannotRemoveLastState"));
      return;
    }

    editor.handleRemoveColumn(colIndex);
  };

  return (
    <div data-testid="tm-config-view" className="flex w-full flex-col gap-6">
      <div className="space-y-4 lg:mx-auto lg:w-max lg:max-w-full">
        <h2 data-testid="tm-config-title" className="text-lg font-bold">
          {t("turing-machine.config.general.title")}
        </h2>

        {combinedError && (
          <div
            data-testid="tm-config-error"
            className="bg-destructive/10 text-destructive rounded-md border border-current/20 p-3 text-sm whitespace-pre-line"
          >
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

          <div className="flex flex-col gap-4">
            <TMHaltStatesPanel
              states={editor.draft.states}
              initialState={editor.draft.initialState}
              haltStates={editor.draft.haltStates}
              disabled={editor.hasBlockingCellIssue}
              onToggle={editor.handleToggleHaltState}
              onAddHaltState={editor.handleAddHaltState}
            />

            <TMAlphabetPanel
              title={t("turing-machine.config.alphabets.inputAlphabet")}
              symbols={editor.draft.inputAlphabet}
              testId="tm-input-alphabet"
            />

            <TMAlphabetPanel
              title={t("turing-machine.config.alphabets.tapeAlphabet")}
              symbols={displayedTapeAlphabet}
              testId="tm-tape-alphabet"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function translateCellIssue(t: TFunction, code: TMEditorCellIssueCode): string {
  if (code === "symbol_single_char") {
    return t("turing-machine.config.editing.symbolSingleChar");
  }

  if (code === "symbol_duplicate") {
    return t("turing-machine.config.editing.symbolDuplicate");
  }

  return t("turing-machine.config.editing.transitionCellInvalid");
}

function translateProgramIssue(t: TFunction, issue: TMProgramIssue): string {
  const keyByCode: Record<TMProgramIssueCode, string> = {
    states_empty: "turing-machine.validation.program.statesEmpty",
    initial_state_missing:
      "turing-machine.validation.program.initialStateMissing",
    halt_states_empty: "turing-machine.validation.program.haltStatesEmpty",
    halt_state_missing: "turing-machine.validation.program.haltStateMissing",
    blank_symbol_missing:
      "turing-machine.validation.program.blankSymbolMissing",
    blank_symbol_invalid:
      "turing-machine.validation.program.blankSymbolInvalid",
    tape_symbol_invalid: "turing-machine.validation.program.tapeSymbolInvalid",
    initial_tape_invalid_symbol:
      "turing-machine.validation.program.initialTapeInvalidSymbol",
    transition_read_symbol_missing:
      "turing-machine.validation.program.transitionReadSymbolMissing",
    transition_read_symbol_invalid:
      "turing-machine.validation.program.transitionReadSymbolInvalid",
    transition_state_missing:
      "turing-machine.validation.program.transitionStateMissing",
    transition_next_state_missing:
      "turing-machine.validation.program.transitionNextStateMissing",
    transition_write_symbol_missing:
      "turing-machine.validation.program.transitionWriteSymbolMissing",
    transition_write_symbol_invalid:
      "turing-machine.validation.program.transitionWriteSymbolInvalid",
  };

  return t(
    keyByCode[issue.code] as never,
    issue.params as never,
  ) as unknown as string;
}

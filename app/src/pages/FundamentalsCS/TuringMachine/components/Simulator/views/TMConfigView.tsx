import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { TMConfig } from "../types";
import { isSingleTapeSymbol } from "../utils/tmSymbolValidation";
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
import { TMGeneralSettings } from "./TMGeneralSettings";
import { TMHaltStatesPanel } from "./TMHaltStatesPanel";
import { TMTransitionTableEditor } from "./TMTransitionTableEditor";

export interface TMConfigViewProps {
  config: TMConfig;
  onChange: (newConfig: TMConfig) => void;
  validationError?: string | null;
}

export function TMConfigView({
  config,
  onChange,
  validationError,
}: TMConfigViewProps) {
  const { t } = useTranslation();

  const orderedTapeAlphabet = getOrderedTapeAlphabet(config);
  const tableHeaders = useMemo(
    () => buildTransitionTableHeaders(config.states),
    [config.states],
  );
  const tableRows = useMemo(() => buildTransitionTableRows(config), [config]);

  const handleCellChange = (
    rowIndex: number,
    colIndex: number,
    value: string,
  ) => {
    const symbol = orderedTapeAlphabet[rowIndex];
    if (!symbol) {
      return;
    }

    if (colIndex === 0) {
      if (symbol === config.blankSymbol) {
        return;
      }

      if (!isSingleTapeSymbol(value)) {
        return;
      }

      if (config.tapeAlphabet.includes(value) && value !== symbol) {
        return;
      }

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

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4">
      <div className="space-y-4">
        <h2 className="text-lg font-bold">
          {t("tm.config.title", "Turing Machine Configuration")}
        </h2>

        {validationError && (
          <div className="bg-destructive/10 text-destructive rounded-md border border-current/20 p-3 text-sm whitespace-pre-line">
            {validationError}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_12rem]">
          <TMGeneralSettings
            config={config}
            onInitialTapeChange={(value) =>
              onChange(updateInitialTape(config, value))
            }
            onInitialStateChange={(state) =>
              onChange(updateInitialState(config, state))
            }
          />

          <TMTransitionTableEditor
            headers={tableHeaders}
            rows={tableRows}
            onCellChange={handleCellChange}
            onHeaderChange={handleHeaderChange}
            onAddRow={() => onChange(addTapeSymbol(config))}
            onRemoveRow={handleRemoveRow}
            onAddColumn={() => onChange(addState(config))}
            onRemoveColumn={handleRemoveColumn}
          />

          <TMHaltStatesPanel
            states={config.states}
            initialState={config.initialState}
            haltStates={config.haltStates}
            onToggle={(state, isHalting) =>
              onChange(toggleHaltState(config, state, isHalting))
            }
          />
        </div>
      </div>
    </div>
  );
}

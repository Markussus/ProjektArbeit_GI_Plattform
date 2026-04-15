import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TableView } from "@/components/shared/TableVisual/TableView";
import type { TMConfig } from "./types";
import { formatState, parseTransition, formatTransition } from "./types";

export interface TMConfigViewProps {
  config: TMConfig;
  onChange: (newConfig: TMConfig) => void;
}

export function TMConfigView({ config, onChange }: TMConfigViewProps) {
  const { t } = useTranslation();

  const handleInitialTapeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onChange({ ...config, initialTape: value.split("") });
  };

  const tableHeaders: string[] = ["δ", ...config.states.map(formatState)];

  const tableRows = useMemo(() => {
    // Ensure blankSymbol is always the very first element in the tapeAlphabet rendering
    const sortedAlphabet = [
      config.blankSymbol,
      ...config.tapeAlphabet.filter((s) => s !== config.blankSymbol),
    ];

    return sortedAlphabet.map((symbol) => {
      const row: string[] = [symbol];
      config.states.forEach((state) => {
        const trans = config.transitions[symbol]?.[state];
        row.push(formatTransition(trans));
      });
      return row;
    });
  }, [
    config.tapeAlphabet,
    config.states,
    config.transitions,
    config.blankSymbol,
  ]);

  const handleCellChange = (
    rowIndex: number,
    colIndex: number,
    value: string,
  ) => {
    // Determine the actual symbol since we sorted the rendering array
    const sortedAlphabet = [
      config.blankSymbol,
      ...config.tapeAlphabet.filter((s) => s !== config.blankSymbol),
    ];
    const symbol = sortedAlphabet[rowIndex];

    if (colIndex === 0) {
      if (symbol === config.blankSymbol) return; // Cannot edit blank symbol
      if (config.tapeAlphabet.includes(value) && value !== symbol) return; // Prevent exact duplicates

      const newAlphabet = config.tapeAlphabet.map((s) =>
        s === symbol ? value : s,
      );

      const newTransitions = JSON.parse(JSON.stringify(config.transitions));
      if (newTransitions[symbol] !== undefined) {
        newTransitions[value] = newTransitions[symbol];
        delete newTransitions[symbol];
      }

      onChange({
        ...config,
        tapeAlphabet: newAlphabet,
        transitions: newTransitions,
      });
      return;
    }

    const state = config.states[colIndex - 1]; // Offset by 1 for the symbol column

    // Copy transitions
    const newTransitions = JSON.parse(JSON.stringify(config.transitions));

    const parsed = parseTransition(value);
    if (parsed) {
      if (!newTransitions[symbol]) newTransitions[symbol] = {};
      newTransitions[symbol][state] = parsed;
    } else {
      // If cleared or invalid format, we might remove the transition
      if (value.trim() === "") {
        if (newTransitions[symbol] && newTransitions[symbol][state]) {
          delete newTransitions[symbol][state];
        }
      } else if (
        !config.transitions[symbol] ||
        !config.transitions[symbol][state]
      ) {
        // Insert a template if the user starts typing in an empty cell
        if (!newTransitions[symbol]) newTransitions[symbol] = {};
        newTransitions[symbol][state] = {
          nextState: "q",
          writeSymbol: config.blankSymbol,
          movement: "N",
        };
      }
    }

    onChange({ ...config, transitions: newTransitions });
  };

  const handleAddRow = () => {
    let newSymbol = "0";
    while (config.tapeAlphabet.includes(newSymbol)) {
      newSymbol = String.fromCharCode(newSymbol.charCodeAt(0) + 1);
    }
    onChange({
      ...config,
      tapeAlphabet: [...config.tapeAlphabet, newSymbol],
    });
  };

  const handleRemoveRow = (rowIndex: number) => {
    const sortedAlphabet = [
      config.blankSymbol,
      ...config.tapeAlphabet.filter((s) => s !== config.blankSymbol),
    ];
    const symbol = sortedAlphabet[rowIndex];

    if (symbol === config.blankSymbol) {
      alert(
        t("tm.config.cannotRemoveBlank", "The blank symbol cannot be removed."),
      );
      return;
    }

    const newAlphabet = config.tapeAlphabet.filter((s) => s !== symbol);
    const newTransitions = JSON.parse(JSON.stringify(config.transitions));
    delete newTransitions[symbol];

    onChange({
      ...config,
      tapeAlphabet: newAlphabet,
      transitions: newTransitions,
    });
  };

  const handleAddColumn = () => {
    let newNum = 0;
    while (config.states.includes(`q${newNum}`)) {
      newNum++;
    }
    const newState = `q${newNum}`;
    onChange({
      ...config,
      states: [...config.states, newState],
    });
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

    const stateToRemove = config.states[colIndex - 1]; // Offset by 1 for symbol column
    const newStates = config.states.filter((s) => s !== stateToRemove);

    const newTransitions = JSON.parse(JSON.stringify(config.transitions));
    for (const symbol in newTransitions) {
      if (newTransitions[symbol] && newTransitions[symbol][stateToRemove]) {
        delete newTransitions[symbol][stateToRemove];
      }
    }

    const newHaltStates = config.haltStates.filter((s) => s !== stateToRemove);
    let newInitialState = config.initialState;
    if (newInitialState === stateToRemove) {
      newInitialState = newStates[0];
    }

    onChange({
      ...config,
      states: newStates,
      transitions: newTransitions,
      haltStates: newHaltStates,
      initialState: newInitialState,
    });
  };

  const handleHeaderChange = (colIndex: number, value: string) => {
    if (colIndex === 0) return; // Cannot rename symbol column

    // Simplify handling by unformatting subscripts or just accepting raw input
    // To properly support this, we would need a parsing logic, but we can just use the value directly
    // Wait, the TableView headers are rendered with formatState. If they type "q1", it's raw.
    // We can just keep the underlying state name as whatever they type, but it might get formatted.
    // If they type `q1`, state becomes `q1`, `formatState` makes it `q₁`.
    // We should allow reasonable renaming, let's keep it simple:
    const oldState = config.states[colIndex - 1];
    if (
      value.trim() === "" ||
      (config.states.includes(value.trim()) && value.trim() !== oldState)
    ) {
      return; // Invalid or duplicate names ignored
    }

    const newStates = [...config.states];
    newStates[colIndex - 1] = value;

    const newTransitions = JSON.parse(JSON.stringify(config.transitions));
    for (const symbol in newTransitions) {
      if (newTransitions[symbol] && newTransitions[symbol][oldState]) {
        newTransitions[symbol][value] = newTransitions[symbol][oldState];
        delete newTransitions[symbol][oldState];
      }
    }

    const newHaltStates = config.haltStates.map((s) =>
      s === oldState ? value : s,
    );
    const newInitialState =
      config.initialState === oldState ? value : config.initialState;

    onChange({
      ...config,
      states: newStates,
      transitions: newTransitions,
      haltStates: newHaltStates,
      initialState: newInitialState,
    });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4">
      <div className="space-y-4">
        <h2 className="text-lg font-bold">
          {t("tm.config.title", "Turing Machine Configuration")}
        </h2>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">
            {t("tm.config.initialTape", "Initial Tape Word")}
          </label>
          <input
            type="text"
            className="rounded border p-2 font-mono text-lg"
            value={config.initialTape.join("")}
            onChange={handleInitialTapeChange}
            placeholder={t(
              "tm.config.initialTapePlaceholder",
              "Enter input word (e.g., 1011)",
            )}
          />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <h3 className="text-md font-semibold">
            {t("tm.config.transitionTable", "Transition Table")}
          </h3>
          <p className="text-muted-foreground text-sm">
            {t("tm.config.transitionFormat", "Format:")}{" "}
            <code>(Next State, Write Symbol, Movement)</code>
            {t("tm.config.transitionExample", " e.g., (q1, 0, R)")}
          </p>
          <TableView
            headers={tableHeaders}
            rows={tableRows}
            editable={true}
            onCellChange={handleCellChange}
            onHeaderChange={handleHeaderChange}
            canAddRow={true}
            onAddRow={handleAddRow}
            canRemoveRow={true}
            onRemoveRow={handleRemoveRow}
            canAddColumn={true}
            onAddColumn={handleAddColumn}
            canRemoveColumn={true}
            onRemoveColumn={handleRemoveColumn}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

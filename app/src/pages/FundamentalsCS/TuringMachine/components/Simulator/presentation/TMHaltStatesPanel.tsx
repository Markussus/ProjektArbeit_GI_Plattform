import { useCallback, useState } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  formatTMStateName,
  normalizeTMStateName,
} from "../domain/tmFormatting";
import type { StateName } from "../domain/tmTypes";

export interface TMHaltStatesPanelProps {
  states: StateName[];
  initialState: StateName;
  haltStates: StateName[];
  onToggle: (state: StateName, isHalting: boolean) => void;
  onAddHaltState: (state: StateName) => void;
  disabled?: boolean;
}

export function TMHaltStatesPanel({
  states,
  initialState,
  haltStates,
  onToggle,
  onAddHaltState,
  disabled = false,
}: TMHaltStatesPanelProps) {
  const { t } = useTranslation();
  const [newState, setNewState] = useState("");
  const selectableStates = states.filter((state) => state !== initialState);
  const commitNewState = useCallback(() => {
    const normalizedState = normalizeTMStateName(newState).trim();

    if (
      normalizedState === "" ||
      normalizedState === initialState ||
      states.includes(normalizedState)
    ) {
      return;
    }

    onAddHaltState(normalizedState);
    setNewState("");
  }, [initialState, newState, onAddHaltState, states]);

  return (
    <div data-testid="tm-halt-states-panel" className="flex flex-col gap-2">
      <div data-testid="tm-halt-states-header" className="mb-2 min-h-[3.5rem]">
        <h3 className="text-md font-semibold">
          {t("tm.config.haltStates.haltStates")}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t("tm.config.haltStates.haltStatesDesc")}
        </p>
      </div>

      <div
        data-testid="tm-halt-states-list"
        className="bg-card flex flex-col gap-2 rounded border p-3"
      >
        {selectableStates.map((state) => {
          const isChecked = haltStates.includes(state);

          return (
            <label
              key={state}
              data-testid={`tm-halt-state-${state}`}
              data-state={state}
              data-checked={isChecked}
              className="flex cursor-pointer items-center gap-2"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(event) => onToggle(state, event.target.checked)}
                disabled={disabled}
                data-testid={`tm-halt-state-input-${state}`}
                className="peer sr-only"
              />
              <span className="border-input bg-background peer-focus-visible:ring-brand peer-checked:bg-brand peer-checked:border-brand flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:outline-none peer-disabled:opacity-50">
                {isChecked && (
                  <Check className="text-brand-foreground h-3 w-3" />
                )}
              </span>
              <span className="font-mono">{formatTMStateName(state)}</span>
            </label>
          );
        })}

        {selectableStates.length === 0 && (
          <span className="text-muted-foreground text-sm italic">
            {t("tm.config.haltStates.noStates")}
          </span>
        )}

        <div className="flex items-center gap-2 pt-1">
          <span className="border-input bg-background flex h-4 w-4 shrink-0 items-center justify-center rounded border">
            <Check className="h-3 w-3" />
          </span>
          <input
            type="text"
            value={newState}
            onChange={(event) => setNewState(event.target.value)}
            onBlur={commitNewState}
            onKeyDown={(event) => {
              if (event.key !== "Enter") {
                return;
              }

              event.preventDefault();
              commitNewState();
            }}
            disabled={disabled}
            data-testid="tm-add-halt-state-input"
            placeholder={t("tm.config.haltStates.addHaltStatePlaceholder")}
            aria-label={t("tm.config.haltStates.addHaltState")}
            className="border-input bg-background h-9 w-full rounded border px-3 py-2 font-mono text-sm"
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
}

import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { StateName } from "../domain/tmTypes";

export interface TMHaltStatesPanelProps {
  states: StateName[];
  initialState: StateName;
  haltStates: StateName[];
  onToggle: (state: StateName, isHalting: boolean) => void;
  disabled?: boolean;
}

export function TMHaltStatesPanel({
  states,
  initialState,
  haltStates,
  onToggle,
  disabled = false,
}: TMHaltStatesPanelProps) {
  const { t } = useTranslation();
  const selectableStates = states.filter((state) => state !== initialState);

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-2 min-h-[3.5rem]">
        <h3 className="text-md font-semibold">{t("tm.config.haltStates")}</h3>
        <p className="text-muted-foreground text-sm">
          {t("tm.config.haltStatesDesc")}
        </p>
      </div>

      <div className="bg-card flex flex-col gap-2 rounded border p-3">
        {selectableStates.map((state) => {
          const isChecked = haltStates.includes(state);

          return (
            <label
              key={state}
              className="flex cursor-pointer items-center gap-2"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(event) => onToggle(state, event.target.checked)}
                disabled={disabled}
                className="peer sr-only"
              />
              <span className="border-input bg-background peer-focus-visible:ring-brand peer-checked:bg-brand peer-checked:border-brand flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:outline-none peer-disabled:opacity-50">
                {isChecked && (
                  <Check className="text-brand-foreground h-3 w-3" />
                )}
              </span>
              <span className="font-mono">{formatState(state)}</span>
            </label>
          );
        })}

        {selectableStates.length === 0 && (
          <span className="text-muted-foreground text-sm italic">
            {t("tm.config.noStates")}
          </span>
        )}
      </div>
    </div>
  );
}

function formatState(state: string): string {
  return state.replace(/\d+/g, (match) => {
    return match
      .split("")
      .map((digit) => String.fromCharCode(8320 + Number.parseInt(digit, 10)))
      .join("");
  });
}

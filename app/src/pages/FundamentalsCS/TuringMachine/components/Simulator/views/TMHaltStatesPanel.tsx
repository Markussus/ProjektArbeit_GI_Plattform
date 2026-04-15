import { useTranslation } from "react-i18next";
import type { StateName } from "../types";
import { formatState } from "../utils/tmFormatting";

interface TMHaltStatesPanelProps {
  states: StateName[];
  initialState: StateName;
  haltStates: StateName[];
  onToggle: (state: StateName, isHalting: boolean) => void;
}

export function TMHaltStatesPanel({
  states,
  initialState,
  haltStates,
  onToggle,
}: TMHaltStatesPanelProps) {
  const { t } = useTranslation();
  const selectableStates = states.filter((state) => state !== initialState);

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-2 min-h-[3.5rem]">
        <h3 className="text-md font-semibold">
          {t("tm.config.haltStates", "Halt States")}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t("tm.config.haltStatesDesc", "Mark states as halting.")}
        </p>
      </div>

      <div className="bg-card flex flex-col gap-2 rounded border p-3">
        {selectableStates.map((state) => (
          <label key={state} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={haltStates.includes(state)}
              onChange={(event) => onToggle(state, event.target.checked)}
              className="text-primary h-4 w-4 cursor-pointer rounded border-gray-300"
            />
            <span className="font-mono">{formatState(state)}</span>
          </label>
        ))}

        {selectableStates.length === 0 && (
          <span className="text-muted-foreground text-sm italic">
            {t("tm.config.noStates", "No states available")}
          </span>
        )}
      </div>
    </div>
  );
}

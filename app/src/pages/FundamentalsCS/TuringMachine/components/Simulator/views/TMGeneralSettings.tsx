import { useTranslation } from "react-i18next";
import type { TMConfig } from "../types";
import { formatState } from "../utils/tmFormatting";

export interface TMGeneralSettingsProps {
  config: TMConfig;
  onInitialTapeChange: (value: string) => void;
  onInitialStateChange: (state: string) => void;
  disabled?: boolean;
}

export function TMGeneralSettings({
  config,
  onInitialTapeChange,
  onInitialStateChange,
  disabled = false,
}: TMGeneralSettingsProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">
          {t("tm.config.initialTape", "Initial Tape Word")}
        </label>
        <input
          type="text"
          className="h-12 w-full rounded border px-3 py-2 font-mono text-lg"
          value={config.initialTape.join("")}
          onChange={(event) => onInitialTapeChange(event.target.value)}
          disabled={disabled}
          placeholder={t(
            "tm.config.initialTapePlaceholder",
            "Enter input word (e.g., 1011)",
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">
          {t("tm.config.startState", "Start State")}
        </label>
        <select
          className="bg-background h-12 w-full rounded border px-3 py-2 font-mono text-lg"
          value={config.initialState}
          onChange={(event) => onInitialStateChange(event.target.value)}
          disabled={disabled}
        >
          {config.states
            .filter(
              (state) =>
                !config.haltStates.includes(state) ||
                state === config.initialState,
            )
            .map((state) => (
              <option key={state} value={state}>
                {formatState(state)}
              </option>
            ))}
        </select>
      </div>
    </>
  );
}

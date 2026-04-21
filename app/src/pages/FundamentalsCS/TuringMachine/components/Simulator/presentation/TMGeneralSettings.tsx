import { useTranslation } from "react-i18next";
import type { TMProgram } from "../domain/tmProgram";

export interface TMGeneralSettingsProps {
  program: TMProgram;
  onInitialTapeChange: (value: string) => void;
  onInitialStateChange: (state: string) => void;
  disabled?: boolean;
}

export function TMGeneralSettings({
  program,
  onInitialTapeChange,
  onInitialStateChange,
  disabled = false,
}: TMGeneralSettingsProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">
          {t("tm.config.initialTape")}
        </label>
        <input
          type="text"
          className="h-12 w-full rounded border px-3 py-2 font-mono text-lg"
          value={program.initialTape.join("")}
          onChange={(event) => onInitialTapeChange(event.target.value)}
          disabled={disabled}
          placeholder={t("tm.config.initialTapePlaceholder")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">
          {t("tm.config.startState")}
        </label>
        <select
          className="bg-background h-12 w-full rounded border px-3 py-2 font-mono text-lg"
          value={program.initialState}
          onChange={(event) => onInitialStateChange(event.target.value)}
          disabled={disabled}
        >
          {program.states
            .filter(
              (state) =>
                !program.haltStates.includes(state) ||
                state === program.initialState,
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

function formatState(state: string): string {
  return state.replace(/\d+/g, (match) => {
    return match
      .split("")
      .map((digit) => String.fromCharCode(8320 + Number.parseInt(digit, 10)))
      .join("");
  });
}

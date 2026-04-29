import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DropdownSelect } from "@/components/shared/DropdownSelect/DropdownSelect";
import { formatTMStateName } from "../domain/tmFormatting";
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
  const selectableStates = useMemo(() => {
    return program.states.filter(
      (state) =>
        !program.haltStates.includes(state) || state === program.initialState,
    );
  }, [program.haltStates, program.initialState, program.states]);
  const startStateOptions = useMemo(() => {
    return selectableStates.map((state) => {
      const label = (
        <span className="font-mono text-lg">{formatTMStateName(state)}</span>
      );

      return {
        value: state,
        label,
        triggerLabel: label,
      };
    });
  }, [selectableStates]);

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">
          {t("tm.config.general.initialTape")}
        </label>
        <input
          type="text"
          className="h-12 w-full rounded border px-3 py-2 font-mono text-lg"
          value={program.initialTape.join("")}
          onChange={(event) => onInitialTapeChange(event.target.value)}
          disabled={disabled}
          placeholder={t("tm.config.general.initialTapePlaceholder")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">
          {t("tm.config.general.startState")}
        </label>
        <DropdownSelect
          value={program.initialState}
          options={startStateOptions}
          onChange={onInitialStateChange}
          ariaLabel={t("tm.config.general.startState")}
          disabled={disabled}
          triggerClassName="h-12 w-full px-3 py-2"
          menuClassName="right-0 left-0"
        />
      </div>
    </>
  );
}

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DropdownSelect } from "@/components/shared/DropdownSelect/DropdownSelect";
import type { UseFAConfigEditorResult } from "../application/useFAConfigEditor";
import type { FAProgramIssueCode } from "../domain/faProgramValidation";
import { FATransitionTableEditor } from "./FATransitionTableEditor";

function ArrayInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string[];
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [localValue, setLocalValue] = useState(value.join(", "));
  const [prevValue, setPrevValue] = useState(value);

  // Derived state pattern: if the external value array structurally changes,
  // we overwrite the local input state.
  if (JSON.stringify(prevValue) !== JSON.stringify(value)) {
    setLocalValue(value.join(", "));
    setPrevValue(value);
  }

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        onChange(e.target.value);
      }}
      // Typing needs the raw text — "0, 1," is a half-typed third symbol, not a
      // mistake. Once the field is left, it shows the set that was actually
      // kept, so a repeated entry visibly collapses instead of looking accepted.
      onBlur={() => setLocalValue(value.join(", "))}
      className={className}
      placeholder={placeholder}
    />
  );
}

export interface FAConfigViewProps {
  editor: UseFAConfigEditorResult;
}

export function FAConfigView({ editor }: FAConfigViewProps) {
  const { t } = useTranslation();

  const typeOptions = useMemo(
    () => [
      { value: "DFA" as const, label: "DFA" },
      { value: "NFA" as const, label: "NFA" },
    ],
    [],
  );

  const startStateOptions = useMemo(
    () =>
      editor.draft.states.map((s) => ({
        value: s,
        label: <span className="font-mono">{s}</span>,
      })),
    [editor.draft.states],
  );

  const issueMessages = editor.validationIssues
    .map((issue) => translateIssue(issue.code))
    .join("\n");

  function translateIssue(code: FAProgramIssueCode): string {
    const map: Record<FAProgramIssueCode, string> = {
      states_empty: t(
        "finite-automata.validation.statesEmpty",
        "States must not be empty.",
      ),
      start_state_missing: t(
        "finite-automata.validation.startStateMissing",
        "Start state is not in the state set.",
      ),
      accept_states_reference_invalid: t(
        "finite-automata.validation.acceptStatesInvalid",
        "An accept state is not in the state set.",
      ),
      alphabet_empty: t(
        "finite-automata.validation.alphabetEmpty",
        "Alphabet must not be empty.",
      ),
      transition_source_invalid: t(
        "finite-automata.validation.transitionSourceInvalid",
        "A transition source state is invalid.",
      ),
      transition_target_invalid: t(
        "finite-automata.validation.transitionTargetInvalid",
        "A transition target state is invalid.",
      ),
      transition_symbol_invalid: t(
        "finite-automata.validation.transitionSymbolInvalid",
        "A transition symbol is not in the alphabet.",
      ),
      dfa_nondeterministic: t(
        "finite-automata.validation.dfaNondeterministic",
        "DFA has nondeterministic transitions.",
      ),
      dfa_epsilon_transition: t(
        "finite-automata.validation.dfaEpsilon",
        "DFA must not have ε-transitions.",
      ),
    };
    return map[code] || code;
  }

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none";
  const labelClass = "text-sm font-medium";

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold">
        {t("finite-automata.config.title", "Automaton Configuration")}
      </h2>

      {issueMessages && (
        <div className="bg-destructive/10 text-destructive rounded-md border border-current/20 p-3 text-sm whitespace-pre-line">
          {issueMessages}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Automaton Type */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>
            {t("finite-automata.config.type", "Type")}
          </label>
          <DropdownSelect<"DFA" | "NFA">
            value={editor.draft.type}
            options={typeOptions}
            onChange={(val) => editor.setAutomatonType(val)}
            ariaLabel={t("finite-automata.config.type", "Type")}
            triggerClassName="w-full h-[38px] px-3 py-2 text-sm"
            menuClassName="right-0 left-0"
            triggerTestId="fa-type-select"
            menuTestId="fa-type-menu"
            optionTestIdPrefix="fa-type-option"
          />
        </div>

        {/* Alphabet */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>
            {t("finite-automata.config.alphabet", "Alphabet (comma-separated)")}
          </label>
          <ArrayInput
            value={editor.draft.alphabet}
            onChange={editor.setAlphabet}
            className={inputClass}
            placeholder="a, b"
          />
        </div>

        {/* Start State */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>
            {t("finite-automata.config.startState", "Start State")}
          </label>
          <DropdownSelect<string>
            value={editor.draft.startState}
            options={startStateOptions}
            onChange={(val) => editor.setStartState(val)}
            ariaLabel={t("finite-automata.config.startState", "Start State")}
            triggerClassName="w-full h-[38px] px-3 py-2 text-sm"
            menuClassName="right-0 left-0"
            triggerTestId="fa-start-state-select"
            menuTestId="fa-start-state-menu"
            optionTestIdPrefix="fa-start-state-option"
          />
        </div>

        {/* Accept States — sits beside Start State so the 2×2 grid has no
            empty cell. */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>
            {t(
              "finite-automata.config.acceptStates",
              "Accept States (comma-separated)",
            )}
          </label>
          <ArrayInput
            value={editor.draft.acceptStates}
            onChange={editor.setAcceptStates}
            className={inputClass}
            placeholder="S2"
          />
        </div>
      </div>

      {/* Transition Table Editor */}
      <FATransitionTableEditor
        program={editor.draft}
        onTransitionChange={editor.setTransition}
        onAddState={editor.addState}
        onRemoveState={editor.removeState}
      />
    </div>
  );
}

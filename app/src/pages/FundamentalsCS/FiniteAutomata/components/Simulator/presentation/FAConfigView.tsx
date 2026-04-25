import { useState } from "react";
import { useTranslation } from "react-i18next";
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

  const issueMessages = editor.validationIssues
    .map((issue) => translateIssue(issue.code))
    .join("\n");

  function translateIssue(code: FAProgramIssueCode): string {
    const map: Record<FAProgramIssueCode, string> = {
      states_empty: t("fa.validation.statesEmpty", "States must not be empty."),
      start_state_missing: t(
        "fa.validation.startStateMissing",
        "Start state is not in the state set.",
      ),
      accept_states_reference_invalid: t(
        "fa.validation.acceptStatesInvalid",
        "An accept state is not in the state set.",
      ),
      alphabet_empty: t(
        "fa.validation.alphabetEmpty",
        "Alphabet must not be empty.",
      ),
      transition_source_invalid: t(
        "fa.validation.transitionSourceInvalid",
        "A transition source state is invalid.",
      ),
      transition_target_invalid: t(
        "fa.validation.transitionTargetInvalid",
        "A transition target state is invalid.",
      ),
      transition_symbol_invalid: t(
        "fa.validation.transitionSymbolInvalid",
        "A transition symbol is not in the alphabet.",
      ),
      dfa_nondeterministic: t(
        "fa.validation.dfaNondeterministic",
        "DFA has nondeterministic transitions.",
      ),
      dfa_epsilon_transition: t(
        "fa.validation.dfaEpsilon",
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
        {t("fa.config.title", "Automaton Configuration")}
      </h2>

      {issueMessages && (
        <div className="bg-destructive/10 text-destructive rounded-md border border-current/20 p-3 text-sm whitespace-pre-line">
          {issueMessages}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Automaton Type */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>{t("fa.config.type", "Type")}</label>
          <select
            value={editor.draft.type}
            onChange={(e) =>
              editor.setAutomatonType(e.target.value as "DFA" | "NFA")
            }
            className={inputClass}
          >
            <option value="DFA">DFA</option>
            <option value="NFA">NFA</option>
          </select>
        </div>

        {/* States */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>
            {t("fa.config.states", "States (comma-separated)")}
          </label>
          <ArrayInput
            value={editor.draft.states}
            onChange={editor.setStates}
            className={inputClass}
            placeholder="s0, s1, s2"
          />
        </div>

        {/* Alphabet */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>
            {t("fa.config.alphabet", "Alphabet (comma-separated)")}
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
            {t("fa.config.startState", "Start State")}
          </label>
          <select
            value={editor.draft.startState}
            onChange={(e) => editor.setStartState(e.target.value)}
            className={inputClass}
          >
            {editor.draft.states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Accept States */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className={labelClass}>
            {t("fa.config.acceptStates", "Accept States (comma-separated)")}
          </label>
          <ArrayInput
            value={editor.draft.acceptStates}
            onChange={editor.setAcceptStates}
            className={inputClass}
            placeholder="q2"
          />
        </div>
      </div>

      {/* Transition Table Editor */}
      <FATransitionTableEditor
        program={editor.draft}
        onTransitionChange={editor.setTransition}
      />
    </div>
  );
}

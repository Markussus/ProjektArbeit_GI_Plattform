import { useState, type DragEvent } from "react";
import { GripVertical, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  formatInternalNumber,
  parseInternalNumber,
} from "../domain/mooreProgram";
import type { MooreOutput } from "../domain/mooreTypes";
import type { MealyProgram } from "../domain/mealyTypes";

interface Props {
  program: MealyProgram;
  onSymbolChange: (input: string, state: string, symbol: string) => void;
  onCodeChange: (input: string, state: string, code: number) => void;
}

interface OutputRule {
  key: string;
  inputs: string[];
  output: MooreOutput;
}

export function MealyOutputTable({
  program,
  onSymbolChange,
  onCodeChange,
}: Props) {
  const { t } = useTranslation();
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [emptyRules, setEmptyRules] = useState<Record<string, string[]>>({});
  const rulesByState = Object.fromEntries(
    program.states.map((state) => [state, groupRules(program, state)]),
  );

  const assignInput = (event: DragEvent, state: string, rule: OutputRule) => {
    event.preventDefault();
    setDragTarget(null);
    const input = event.dataTransfer.getData("application/x-mealy-input");
    if (!program.inputSymbols.includes(input) || rule.inputs.includes(input)) {
      return;
    }
    const output =
      rule.inputs.length > 0
        ? rule.output
        : {
            symbol: `OUT_${nextOutputCode(program)}`,
            code: nextOutputCode(program),
          };
    onSymbolChange(input, state, output.symbol);
    onCodeChange(input, state, output.code);
    if (rule.inputs.length === 0) {
      setEmptyRules((current) => ({
        ...current,
        [state]: (current[state] ?? []).filter((id) => id !== rule.key),
      }));
    }
  };

  return (
    <section className="min-w-0 space-y-2">
      <div>
        <h3 className="font-semibold">{t("moore.mealy.outputFunction")}</h3>
        <p className="text-muted-foreground text-sm">
          {t("moore.mealy.outputFunctionHelp")}
        </p>
      </div>
      <div className="border-border overflow-auto rounded-lg border">
        <table
          data-testid="mealy-output-table"
          className="w-full min-w-[42rem] table-fixed border-collapse text-sm"
        >
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="w-1/4 border-r p-3 text-left">
                {t("moore.sim.state")}
              </th>
              <th className="w-1/4 border-r p-3 text-left">
                {t("moore.sim.event")}
              </th>
              <th className="w-1/4 border-r p-3 text-left">
                {t("moore.sim.symbolOutput")}
              </th>
              <th className="w-1/4 p-3 text-left">
                {t("moore.sim.internalOutputCode")}
              </th>
            </tr>
          </thead>
          <tbody>
            {program.states.flatMap((state, stateIndex) => {
              const rules = [
                ...rulesByState[state],
                ...(emptyRules[state] ?? []).map((key) => ({
                  key,
                  inputs: [],
                  output: { symbol: "", code: nextOutputCode(program) },
                })),
              ];
              return rules.map((rule, ruleIndex) => {
                const targetKey = `${state}-${rule.key}`;
                return (
                  <tr key={targetKey} className="border-b last:border-b-0">
                    {ruleIndex === 0 && (
                      <td
                        rowSpan={rules.length}
                        className={cn(
                          "bg-muted/20 border-r p-3 align-top",
                          state === program.initialState && "bg-brand/5",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-semibold">
                            {state}
                          </span>
                          <span className="text-muted-foreground font-mono text-xs">
                            {formatInternalNumber(
                              stateIndex,
                              program.representation,
                            )}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setEmptyRules((current) => ({
                              ...current,
                              [state]: [
                                ...(current[state] ?? []),
                                `empty-${crypto.randomUUID()}`,
                              ],
                            }))
                          }
                          aria-label={t("moore.mealy.addOutputRule", { state })}
                          data-testid={`mealy-add-output-rule-${stateIndex}`}
                          className="border-brand text-brand hover:bg-brand/10 mt-3 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold disabled:opacity-40"
                        >
                          <Plus className="size-3.5" />
                          {t("moore.mealy.addRule")}
                        </button>
                      </td>
                    )}
                    <td
                      data-testid={`mealy-output-input-cell-${stateIndex}-${ruleIndex}`}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragTarget(targetKey);
                      }}
                      onDragLeave={() => setDragTarget(null)}
                      onDrop={(event) => assignInput(event, state, rule)}
                      className={cn(
                        "border-r p-2",
                        dragTarget === targetKey && "bg-brand/10",
                      )}
                    >
                      <div className="flex min-h-9 flex-wrap items-center gap-1.5">
                        {rule.inputs.map((input) => (
                          <InputChip
                            key={input}
                            input={input}
                            testId={`mealy-output-rule-input-${stateIndex}-${ruleIndex}-${input}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="border-r p-2">
                      <input
                        value={rule.output.symbol}
                        disabled={rule.inputs.length === 0}
                        data-testid={`mealy-output-symbol-${stateIndex}-${ruleIndex}`}
                        onChange={(event) =>
                          rule.inputs.forEach((input) =>
                            onSymbolChange(input, state, event.target.value),
                          )
                        }
                        className="border-input bg-background h-9 w-full rounded-md border px-2 font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        key={`${program.representation}-${rule.output.code}`}
                        disabled={rule.inputs.length === 0}
                        data-testid={`mealy-output-code-${stateIndex}-${ruleIndex}`}
                        defaultValue={formatInternalNumber(
                          rule.output.code,
                          program.representation,
                        )}
                        onBlur={(event) => {
                          const code = parseInternalNumber(
                            event.currentTarget.value,
                            program.representation,
                          );
                          if (code === null) {
                            event.currentTarget.value = formatInternalNumber(
                              rule.output.code,
                              program.representation,
                            );
                            return;
                          }
                          rule.inputs.forEach((input) =>
                            onCodeChange(input, state, code),
                          );
                        }}
                        className="border-input bg-background h-9 w-full rounded-md border px-2 font-mono"
                      />
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
      <div
        data-testid="mealy-output-new-rule-dropzone"
        onDragOver={(event) => {
          event.preventDefault();
          setDragTarget("new-rule");
        }}
        onDragLeave={() => setDragTarget(null)}
        onDrop={(event) => {
          event.preventDefault();
          const input = event.dataTransfer.getData("application/x-mealy-input");
          const state = program.states[0];
          if (!state || !program.inputSymbols.includes(input)) return;
          const output = {
            symbol: `OUT_${nextOutputCode(program)}`,
            code: nextOutputCode(program),
          };
          onSymbolChange(input, state, output.symbol);
          onCodeChange(input, state, output.code);
          setDragTarget(null);
        }}
        className={cn(
          "border-border text-muted-foreground rounded-lg border border-dashed p-3 text-center text-sm",
          dragTarget === "new-rule" && "border-brand bg-brand/10 text-brand",
        )}
      >
        {t("moore.mealy.dropForNewRule")}
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-xs">
          {t("moore.mealy.outputDragHelp")}
        </p>
        <div
          data-testid="mealy-output-input-alphabet"
          className="border-border flex min-h-12 flex-wrap gap-2 rounded-lg border p-2"
        >
          {program.inputSymbols.map((input) => (
            <InputChip
              key={input}
              input={input}
              testId={`mealy-output-input-token-${input}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function InputChip({ input, testId }: { input: string; testId?: string }) {
  return (
    <span
      draggable
      data-testid={testId}
      onDragStart={(event) => {
        event.dataTransfer.setData("application/x-mealy-input", input);
        event.dataTransfer.effectAllowed = "move";
      }}
      className="bg-muted inline-flex cursor-grab items-center gap-1 rounded-md border px-2 py-1 font-mono text-sm active:cursor-grabbing"
    >
      <GripVertical className="text-muted-foreground size-3.5" />
      {input}
    </span>
  );
}

function groupRules(program: MealyProgram, state: string): OutputRule[] {
  const rules = new Map<string, OutputRule>();
  for (const input of program.inputSymbols) {
    const output = program.outputs[input][state];
    const key = `${output.symbol}\u0000${output.code}`;
    const rule = rules.get(key);
    if (rule) rule.inputs.push(input);
    else rules.set(key, { key, inputs: [input], output });
  }
  return [...rules.values()];
}

function nextOutputCode(program: MealyProgram) {
  const usedCodes = program.inputSymbols.flatMap((symbol) =>
    program.states.map((candidate) => program.outputs[symbol][candidate].code),
  );
  return Math.max(-1, ...usedCodes) + 1;
}

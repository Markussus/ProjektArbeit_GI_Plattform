import type { TFunction } from "i18next";
import type {
  JavaExerciseScenario,
  JavaValidationCase,
} from "../../../exercises";
import type {
  JavaExecutionRequest,
  JavaExecutionSnapshot,
} from "./javaExecution";

export interface JavaValidationRunRow {
  id: string;
  passed: boolean;
  output: string;
  expectedOutput: string;
  phase: string;
}

export interface JavaValidationRunResult {
  rows: JavaValidationRunRow[];
  error?: string;
}

export interface RunValidationOptions {
  exerciseScenario: JavaExerciseScenario | null;
  code: string;
  standardInput: string;
  timeoutSeconds: number;
  runAsync: (request: JavaExecutionRequest) => Promise<JavaExecutionSnapshot>;
  exampleCheckUnavailableError: string;
}

export async function runExerciseValidation({
  exerciseScenario,
  code,
  standardInput,
  timeoutSeconds,
  runAsync,
  exampleCheckUnavailableError,
}: RunValidationOptions): Promise<JavaValidationRunResult> {
  if (!exerciseScenario) {
    return {
      rows: [],
      error: exampleCheckUnavailableError,
    };
  }

  const rows: JavaValidationRunRow[] = [];

  for (const validationCase of exerciseScenario.validationCases) {
    const row = await evaluateValidationCase({
      validationCase,
      exerciseId: exerciseScenario.id,
      code,
      standardInput,
      timeoutSeconds,
      runAsync,
    });
    rows.push(row);
  }

  return { rows };
}

async function evaluateValidationCase({
  validationCase,
  exerciseId,
  code,
  standardInput,
  timeoutSeconds,
  runAsync,
}: {
  validationCase: JavaValidationCase;
  exerciseId: string;
  code: string;
  standardInput: string;
  timeoutSeconds: number;
  runAsync: (request: JavaExecutionRequest) => Promise<JavaExecutionSnapshot>;
}): Promise<JavaValidationRunRow> {
  const source = validationCase.sourceTransform?.(code) ?? code;
  const result = await runAsync({
    source,
    exerciseId,
    timeoutMs: timeoutSeconds * 1000,
    stdin: validationCase.stdin ?? standardInput,
  });
  const output = result.stdout.join("");

  return {
    id: validationCase.id,
    passed:
      result.phase === "done" &&
      normalizeOutput(output) ===
        normalizeOutput(validationCase.expectedStdout),
    output,
    expectedOutput: validationCase.expectedStdout,
    phase: result.phase,
  };
}

export function normalizeOutput(output: string): string {
  return output.replace(/\r\n/g, "\n").trimEnd();
}

export function buildValidationTableRows(
  checkResult: JavaValidationRunResult | null,
  t: TFunction,
): string[][] {
  if (!checkResult) {
    return [];
  }

  const emptyText = t("java-programming.validation.emptyOutput");
  return checkResult.rows.map((row) => [
    row.passed
      ? t("java-programming.validation.pass")
      : t("java-programming.validation.fail"),
    row.id,
    formatOutput(row.output, emptyText),
    formatOutput(row.expectedOutput, emptyText),
    row.phase,
  ]);
}

function formatOutput(output: string, emptyOutput: string): string {
  const normalized = normalizeOutput(output);
  return normalized === "" ? emptyOutput : normalized;
}

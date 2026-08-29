import { useTranslation } from "react-i18next";
import { SolutionCheckDialog } from "@/components/shared/SolutionCheckDialog";
import type { AutomataValidationResult } from "./Simulator/application/automataSolutionChecker";

interface MooreSolutionCheckDialogProps {
  checkResult: AutomataValidationResult | null;
  onClose: () => void;
}

export function MooreSolutionCheckDialog({
  checkResult,
  onClose,
}: MooreSolutionCheckDialogProps) {
  const { t } = useTranslation();

  const resultRows = checkResult
    ? checkResult.rows.map((row) => [
        row.passed
          ? t("moore-mealy.exercises.validation.pass")
          : t("moore-mealy.exercises.validation.fail"),
        row.input.length
          ? row.input.join(" ")
          : t("moore-mealy.exercises.validation.emptyInput"),
        row.error
          ? t(`moore-mealy.exercises.validation.errors.${row.error}` as never, {
              defaultValue: row.error,
            })
          : formatOutputCodes(row.outputCodes),
        formatOutputCodes(row.expectedOutputCodes),
      ])
    : [];

  return (
    <SolutionCheckDialog
      open={checkResult !== null}
      title={t("moore-mealy.exercises.checkResultTitle")}
      onClose={onClose}
      testId="moore-solution-check-dialog"
      summary={
        <p
          data-testid="moore-solution-check-result"
          data-passed={String(checkResult?.passed)}
          className={
            checkResult?.passed
              ? "text-sm font-medium text-green-700 dark:text-green-400"
              : "text-destructive text-sm font-medium"
          }
        >
          {checkResult?.passed
            ? t("moore-mealy.exercises.checkCorrect")
            : t("moore-mealy.exercises.checkIncorrect", {
                passed:
                  checkResult?.rows.filter((row) => row.passed).length ?? 0,
                total: checkResult?.rows.length ?? 0,
              })}
        </p>
      }
      error={checkResult?.error}
      tableTestIdPrefix="moore-solution-check-table"
      headers={[
        t("moore-mealy.exercises.validation.passed"),
        t("moore-mealy.exercises.validation.input"),
        t("moore-mealy.exercises.validation.output"),
        t("moore-mealy.exercises.validation.expectedOutput"),
      ]}
      rows={resultRows}
      getRowTestAttributes={(rowIndex) => ({
        "data-passed": String(checkResult?.rows[rowIndex]?.passed ?? false),
      })}
      dataColumnWidthClassName="w-[12rem] max-w-[18rem] text-center"
    />
  );
}

function formatOutputCodes(codes: number[]): string {
  return codes.length ? codes.join(" \u2192 ") : "\u2014";
}

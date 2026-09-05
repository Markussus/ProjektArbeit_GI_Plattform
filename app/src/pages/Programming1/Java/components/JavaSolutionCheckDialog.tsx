import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SolutionCheckDialog } from "@/components/shared/SolutionCheckDialog";
import {
  buildValidationTableRows,
  type JavaValidationRunResult,
} from "./Simulator/domain/javaValidationRunner";

interface JavaSolutionCheckDialogProps {
  checkResult: JavaValidationRunResult | null;
  onClose: () => void;
}

export function JavaSolutionCheckDialog({
  checkResult,
  onClose,
}: JavaSolutionCheckDialogProps) {
  const { t } = useTranslation();

  const resultRows = useMemo(
    () => buildValidationTableRows(checkResult, t),
    [checkResult, t],
  );

  return (
    <SolutionCheckDialog
      open={checkResult !== null}
      title={t("java-programming.validation.popupTitle")}
      onClose={onClose}
      testId="java-solution-check-dialog"
      error={checkResult?.error}
      errorTestId="java-solution-check-error"
      tableTestIdPrefix="java-solution-check-table"
      headers={[
        t("java-programming.validation.table.passed"),
        t("java-programming.validation.table.case"),
        t("java-programming.validation.table.output"),
        t("java-programming.validation.table.expectedOutput"),
        t("java-programming.validation.table.phase"),
      ]}
      rows={resultRows}
      getRowTestAttributes={(rowIndex) => ({
        "data-passed": String(checkResult?.rows[rowIndex]?.passed),
      })}
    />
  );
}

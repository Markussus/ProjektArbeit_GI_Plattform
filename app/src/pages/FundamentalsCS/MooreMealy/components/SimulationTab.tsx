import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { InlineTabNavigation } from "@/components/shared/InlineTabNavigation";
import { Popup } from "@/components/shared/Popup/Popup";
import { TableView } from "@/components/shared/TableVisual/TableView";
import {
  MooreSimulator,
  type MooreSimulatorHandle,
} from "./Simulator/MooreSimulator";
import {
  MealySimulator,
  type MealySimulatorHandle,
} from "./Simulator/MealySimulator";
import { defaultMooreProgram } from "./Simulator/config/defaultMooreProgram";
import { defaultMealyProgram } from "./Simulator/config/defaultMealyProgram";
import { getMooreExerciseScenario } from "../exercises";
import {
  runMooreValidation,
  type MooreValidationResult,
} from "./Simulator/application/mooreSolutionChecker";

export const MOORE_EXAMPLE_ID = "moore.examples.mooreDefault";
export const MEALY_EXAMPLE_ID = "moore.examples.mealyDefault";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const { t } = useTranslation();
  const [machineType, setMachineType] = useState<"moore" | "mealy">(() =>
    props.selectedItem?.id === MEALY_EXAMPLE_ID ? "mealy" : "moore",
  );
  const [checkResult, setCheckResult] = useState<MooreValidationResult | null>(
    null,
  );
  const mooreSimulatorRef = useRef<MooreSimulatorHandle | null>(null);
  const mealySimulatorRef = useRef<MealySimulatorHandle | null>(null);
  const isMooreExample = props.selectedItem?.id === MOORE_EXAMPLE_ID;
  const isMealyExample = props.selectedItem?.id === MEALY_EXAMPLE_ID;
  const exerciseScenario = useMemo(
    () =>
      props.selectedExercise
        ? getMooreExerciseScenario(props.selectedExercise.id)
        : null,
    [props.selectedExercise],
  );
  const mooreInitialProgram =
    exerciseScenario?.starterProgram ??
    (isMooreExample ? defaultMooreProgram : undefined);
  const storageEnabled =
    !isMooreExample && !isMealyExample && !exerciseScenario;
  const handleCheckSolution = () => {
    if (!exerciseScenario || !mooreSimulatorRef.current) {
      return;
    }
    setCheckResult(
      runMooreValidation(
        mooreSimulatorRef.current.getProgram(),
        exerciseScenario.validationCases,
      ),
    );
  };
  const resultRows = checkResult
    ? checkResult.rows.map((row) => [
        row.passed
          ? t("moore.exercises.validation.pass")
          : t("moore.exercises.validation.fail"),
        row.input.length
          ? row.input.join(" ")
          : t("moore.exercises.validation.emptyInput"),
        row.error
          ? t(`moore.exercises.validation.errors.${row.error}` as never, {
              defaultValue: row.error,
            })
          : formatOutputCodes(row.outputCodes),
        formatOutputCodes(row.expectedOutputCodes),
      ])
    : [];

  return (
    <>
      <TopicSimulationTab
        {...props}
        selectedItem={props.selectedItem}
        selectedItemActions={
          exerciseScenario ? (
            <>
              <button
                type="button"
                onClick={() =>
                  mooreSimulatorRef.current?.loadProgram(
                    exerciseScenario.solutionProgram,
                  )
                }
                data-testid="moore-load-solution"
                className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium"
              >
                {t("moore.exercises.loadSolution")}
              </button>
              <button
                type="button"
                onClick={handleCheckSolution}
                data-testid="moore-check-solution"
                className="bg-brand text-brand-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium hover:opacity-90"
              >
                {t("moore.exercises.checkSolution")}
              </button>
            </>
          ) : undefined
        }
        emptyStateTextKey="simulation.emptyStates.moore"
        onReset={() => {
          setCheckResult(null);
          if (machineType === "moore") {
            mooreSimulatorRef.current?.resetStoredState();
          } else {
            mealySimulatorRef.current?.resetStoredState();
          }
        }}
      >
        <div className="space-y-6">
          <div className="mx-auto w-full max-w-[100rem]">
            <InlineTabNavigation
              activeTab={machineType}
              onTabChange={setMachineType}
              ariaLabel={t("moore.sim.machineType")}
              className="w-full"
              tabs={[
                {
                  id: "moore",
                  label: t("moore.sim.mooreTab"),
                  testId: "moore-machine-tab-moore",
                },
                {
                  id: "mealy",
                  label: t("moore.sim.mealyTab"),
                  testId: "moore-machine-tab-mealy",
                },
              ]}
            />
          </div>

          <div hidden={machineType !== "moore"}>
            <MooreSimulator
              key={
                exerciseScenario?.id ??
                (isMooreExample ? MOORE_EXAMPLE_ID : "free")
              }
              ref={mooreSimulatorRef}
              initialProgram={mooreInitialProgram}
              storageEnabled={storageEnabled}
            />
          </div>
          <div hidden={machineType !== "mealy"}>
            <MealySimulator
              ref={mealySimulatorRef}
              initialProgram={isMealyExample ? defaultMealyProgram : undefined}
              storageEnabled={storageEnabled}
            />
          </div>
        </div>
      </TopicSimulationTab>
      <Popup
        open={checkResult !== null}
        title={t("moore.exercises.checkResultTitle")}
        onClose={() => setCheckResult(null)}
        testId="moore-solution-check-dialog"
      >
        <div className="space-y-4">
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
              ? t("moore.exercises.checkCorrect")
              : t("moore.exercises.checkIncorrect", {
                  passed:
                    checkResult?.rows.filter((row) => row.passed).length ?? 0,
                  total: checkResult?.rows.length ?? 0,
                })}
          </p>
          {checkResult?.error && (
            <p className="text-sm text-red-600">{checkResult.error}</p>
          )}
          {checkResult && checkResult.rows.length > 0 && (
            <TableView
              testIdPrefix="moore-solution-check-table"
              headers={[
                t("moore.exercises.validation.passed"),
                t("moore.exercises.validation.input"),
                t("moore.exercises.validation.output"),
                t("moore.exercises.validation.expectedOutput"),
              ]}
              rows={resultRows}
              getRowTestAttributes={(rowIndex) => ({
                "data-passed": String(
                  checkResult.rows[rowIndex]?.passed ?? false,
                ),
              })}
              firstColumnWidthClassName="w-[6rem] max-w-[8rem]"
              dataColumnWidthClassName="w-[12rem] max-w-[18rem]"
            />
          )}
        </div>
      </Popup>
    </>
  );
}

function formatOutputCodes(codes: number[]): string {
  return codes.length ? codes.join(" → ") : "—";
}

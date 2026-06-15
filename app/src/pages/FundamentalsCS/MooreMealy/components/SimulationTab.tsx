import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { InlineTabNavigation } from "@/components/shared/InlineTabNavigation";
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

export const MOORE_EXAMPLE_ID = "moore.examples.mooreDefault";
export const MEALY_EXAMPLE_ID = "moore.examples.mealyDefault";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const { t } = useTranslation();
  const [machineType, setMachineType] = useState<"moore" | "mealy">(() =>
    props.selectedItem?.id === MEALY_EXAMPLE_ID ? "mealy" : "moore",
  );
  const mooreSimulatorRef = useRef<MooreSimulatorHandle | null>(null);
  const mealySimulatorRef = useRef<MealySimulatorHandle | null>(null);
  const isMooreExample = props.selectedItem?.id === MOORE_EXAMPLE_ID;
  const isMealyExample = props.selectedItem?.id === MEALY_EXAMPLE_ID;

  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="simulation.emptyStates.moore"
      onReset={() =>
        machineType === "moore"
          ? mooreSimulatorRef.current?.resetStoredState()
          : mealySimulatorRef.current?.resetStoredState()
      }
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
            ref={mooreSimulatorRef}
            initialProgram={isMooreExample ? defaultMooreProgram : undefined}
            storageEnabled={!isMooreExample}
          />
        </div>
        <div hidden={machineType !== "mealy"}>
          <MealySimulator
            ref={mealySimulatorRef}
            initialProgram={isMealyExample ? defaultMealyProgram : undefined}
            storageEnabled={!isMealyExample}
          />
        </div>
      </div>
    </TopicSimulationTab>
  );
}

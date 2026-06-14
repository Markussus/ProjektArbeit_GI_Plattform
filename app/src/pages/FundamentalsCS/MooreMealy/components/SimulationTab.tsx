import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { InlineTabNavigation } from "@/components/shared/InlineTabNavigation";
import {
  MooreSimulator,
  type MooreSimulatorHandle,
} from "./Simulator/MooreSimulator";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const { t } = useTranslation();
  const [machineType, setMachineType] = useState<"moore" | "mealy">("moore");
  const simulatorRef = useRef<MooreSimulatorHandle | null>(null);

  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="simulation.emptyStates.moore"
      onReset={() => simulatorRef.current?.resetStoredState()}
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
          <MooreSimulator ref={simulatorRef} />
        </div>
        {machineType === "mealy" && (
          <div
            data-testid="mealy-simulator-placeholder"
            className="border-border bg-muted/20 rounded-xl border border-dashed p-10 text-center"
          >
            <h2 className="font-semibold">{t("moore.sim.mealyTab")}</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {t("moore.sim.mealyLater")}
            </p>
          </div>
        )}
      </div>
    </TopicSimulationTab>
  );
}

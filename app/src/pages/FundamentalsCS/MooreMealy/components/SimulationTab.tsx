import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { cn } from "@/lib/utils";
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
          <div
            role="tablist"
            aria-label={t("moore.sim.machineType")}
            className="border-border inline-flex rounded-lg border p-1"
          >
            {(["moore", "mealy"] as const).map((type) => (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={machineType === type}
                onClick={() => setMachineType(type)}
                data-testid={`moore-machine-tab-${type}`}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
                  machineType === type
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {type === "moore"
                  ? t("moore.sim.mooreTab")
                  : t("moore.sim.mealyTab")}
              </button>
            ))}
          </div>
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

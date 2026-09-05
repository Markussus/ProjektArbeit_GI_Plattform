import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DecToBinResult, BinToDecResult } from "./fractionalConversion";

interface DecToBinExplanationProps {
  data: DecToBinResult;
}

export function DecToBinExplanation({ data }: DecToBinExplanationProps) {
  const { t } = useTranslation("translation");

  return (
    <div className="divide-border/50 flex flex-col divide-y">
      <div className="p-6">
        <h4 className="text-foreground mb-4 font-semibold">
          1. {t("number-systems.simulator.numbers.fracIntPart")} {data.intVal}
        </h4>
        <p className="text-muted-foreground mb-4 text-sm">
          {t("number-systems.simulator.numbers.decToBinDesc")}
        </p>

        <div className="overflow-x-auto">
          {data.intSteps.length > 0 ? (
            <div className="inline-flex flex-col gap-2 font-mono text-sm">
              {data.intSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="flex w-32 justify-end">
                    {step.dividend} ÷ 2 = {Math.floor(step.dividend / 2)}
                  </div>
                  <div className="text-muted-foreground">
                    {t("number-systems.simulator.numbers.remainder")}
                  </div>
                  <div className="bg-brand/10 text-brand flex h-6 w-6 items-center justify-center rounded font-bold">
                    {step.remainder}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="font-mono text-sm">0 = 0</div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <span className="text-muted-foreground text-sm">
              {t("number-systems.simulator.numbers.resultLabel")}
            </span>
            <span className="bg-muted text-foreground rounded px-3 py-1.5 font-mono font-medium tracking-wider">
              {data.binIntPart}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h4 className="text-foreground mb-4 font-semibold">
          2. {t("number-systems.simulator.numbers.fracFractPart")}{" "}
          {data.fracVal}
        </h4>

        <div className="overflow-x-auto">
          {data.fracSteps.length > 0 ? (
            <div className="inline-flex flex-col gap-2 font-mono text-sm">
              {data.fracSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="flex w-40 justify-end">
                    {step.value} × 2 ={" "}
                    {step.multResult.toFixed(3).replace(/\.?0+$/, "")}
                  </div>
                  <ArrowRight className="text-muted-foreground h-4 w-4" />
                  <div className="text-muted-foreground">
                    {t("number-systems.simulator.numbers.fracIntPart")}
                  </div>
                  <div className="bg-brand/10 text-brand flex h-6 w-6 items-center justify-center rounded font-bold">
                    {step.bit}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="font-mono text-sm">0 = 0</div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <span className="text-muted-foreground text-sm">
              {t("number-systems.simulator.numbers.resultLabel")}
            </span>
            <span className="bg-muted text-foreground rounded px-3 py-1.5 font-mono font-medium tracking-wider">
              0.{data.binFracDisplay}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BinToDecExplanationProps {
  data: BinToDecResult;
}

export function BinToDecExplanation({ data }: BinToDecExplanationProps) {
  const { t } = useTranslation("translation");

  return (
    <div className="divide-border/50 flex flex-col divide-y">
      <div className="p-6">
        <h4 className="text-foreground mb-4 font-semibold">
          {t("number-systems.simulator.numbers.fracSumInt")}
        </h4>
        <p className="text-muted-foreground mb-4 text-sm">
          {t("number-systems.simulator.numbers.fracSumPowers")}
        </p>

        <div className="overflow-x-auto">
          {data.binIntSteps.length > 0 ? (
            <div className="inline-flex flex-col gap-2 font-mono text-sm">
              {data.binIntSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="flex w-32 justify-end">
                    {step.bit} × 2^{step.pos}
                  </div>
                  <div className="text-muted-foreground">=</div>
                  <div className="bg-brand/10 text-brand flex h-6 min-w-8 items-center justify-center rounded px-2 font-bold">
                    {step.powVal}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="font-mono text-sm">0 = 0</div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <span className="text-muted-foreground text-sm">
              {t("number-systems.simulator.numbers.resultLabel")}
            </span>
            <span className="bg-muted text-foreground rounded px-3 py-1.5 font-mono font-medium tracking-wider">
              {data.intDecVal}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h4 className="text-foreground mb-4 font-semibold">
          {t("number-systems.simulator.numbers.fracSumFrac")}
        </h4>

        <div className="overflow-x-auto">
          {data.binFracSteps.length > 0 ? (
            <div className="inline-flex flex-col gap-2 font-mono text-sm">
              {data.binFracSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="flex w-32 justify-end">
                    {step.bit} × 2^{step.pos}
                  </div>
                  <div className="text-muted-foreground">=</div>
                  <div className="bg-brand/10 text-brand flex h-6 min-w-8 items-center justify-center rounded px-2 font-bold">
                    {step.powVal}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="font-mono text-sm">0 = 0</div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <span className="text-muted-foreground text-sm">
              {t("number-systems.simulator.numbers.resultLabel")}
            </span>
            <span className="bg-muted text-foreground rounded px-3 py-1.5 font-mono font-medium tracking-wider">
              {data.fracDecVal}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

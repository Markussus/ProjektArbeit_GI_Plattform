import { ArrowRight, Info } from "lucide-react";
import {
  CollapsibleStep,
  ResultSectionHeader,
  StepByStepToggle,
  WarningBanner,
} from "@/components/shared/SimulatorShared";
import type { TFunction } from "i18next";
import type {
  AddStep,
  OnesComplementStep,
  TwosComplementStep,
} from "./subtractionCalculation";

interface SubtractionResultProps {
  t: TFunction<"translation", undefined>;
  padA: string;
  padB: string;
  onesComp: string;
  twosComp: string;
  onesSteps: OnesComplementStep[];
  twosSteps: TwosComplementStep[];
  addSteps: AddStep[];
  sum: string;
  carries: number[];
  overflow: boolean;
  carryOut: boolean;
  showStepByStep: boolean;
  setShowStepByStep: (value: boolean) => void;
  expanded: Set<string>;
  toggle: (id: string) => void;
}

export function SubtractionResult({
  t,
  padA,
  padB,
  onesComp,
  twosComp,
  onesSteps,
  twosSteps,
  addSteps,
  sum,
  carries,
  overflow,
  carryOut,
  showStepByStep,
  setShowStepByStep,
  expanded,
  toggle,
}: SubtractionResultProps) {
  return (
    <div className="space-y-6">
      <ResultSectionHeader
        icon={<Info className="text-primary h-5 w-5" />}
        title={t("number-systems.simulator.arithmetic.common.stepsResult")}
      />

      <StepByStepToggle
        open={showStepByStep}
        onToggle={() => setShowStepByStep(!showStepByStep)}
      />

      {showStepByStep && (
        <div className="space-y-4">
          <StepOneOnesComplement
            t={t}
            onesSteps={onesSteps}
            onesComp={onesComp}
          />
          <StepTwoAddOne
            t={t}
            twosSteps={twosSteps}
            twosComp={twosComp}
            expanded={expanded}
            toggle={toggle}
          />
          <StepThreeAddition
            t={t}
            addSteps={addSteps}
            expanded={expanded}
            toggle={toggle}
          />
        </div>
      )}

      <StepSummary t={t} padB={padB} onesComp={onesComp} twosComp={twosComp} />

      <AdditionGrid
        padA={padA}
        twosComp={twosComp}
        sum={sum}
        carries={carries}
        carryOut={carryOut}
      />

      <div className="space-y-3">
        {carryOut && (
          <WarningBanner
            variant="info"
            title={t(
              "number-systems.simulator.arithmetic.subtraction.carryOutTitle",
            )}
          >
            {t("number-systems.simulator.arithmetic.subtraction.carryOutInfo")}
          </WarningBanner>
        )}
        {overflow && (
          <WarningBanner
            variant="warning"
            title={t(
              "number-systems.simulator.arithmetic.addition.overflowTitle",
            )}
          >
            {t("number-systems.simulator.arithmetic.addition.overflowWarning")}
          </WarningBanner>
        )}
      </div>
    </div>
  );
}

function StepOneOnesComplement({
  t,
  onesSteps,
  onesComp,
}: {
  t: TFunction<"translation", undefined>;
  onesSteps: OnesComplementStep[];
  onesComp: string;
}) {
  return (
    <div className="bg-background border-border/40 rounded-lg border p-4 shadow-inner">
      <p className="text-muted-foreground mb-3 font-sans text-xs font-bold tracking-normal uppercase">
        {t("number-systems.simulator.arithmetic.subtraction.step1")}
      </p>
      <div className="space-y-2">
        {onesSteps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-4 font-mono text-sm">
            <span className="text-muted-foreground w-16 text-xs">
              {t("number-systems.simulator.arithmetic.subtraction.bitN", {
                n: step.position,
              })}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/10">
              {step.originalBit}
            </span>
            <ArrowRight className="text-muted-foreground h-4 w-4" />
            <span className="bg-destructive/10 text-destructive flex h-8 w-8 items-center justify-center rounded">
              {step.flippedBit}
            </span>
          </div>
        ))}
      </div>
      <div className="border-border/40 mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-muted-foreground text-sm">
          {t("number-systems.simulator.arithmetic.subtraction.onesResult")}
        </span>
        <span className="text-destructive font-mono font-bold">{onesComp}</span>
      </div>
    </div>
  );
}

function StepTwoAddOne({
  t,
  twosSteps,
  twosComp,
  expanded,
  toggle,
}: {
  t: TFunction<"translation", undefined>;
  twosSteps: TwosComplementStep[];
  twosComp: string;
  expanded: Set<string>;
  toggle: (id: string) => void;
}) {
  return (
    <div className="bg-background border-border/40 rounded-lg border p-4 shadow-inner">
      <p className="text-muted-foreground mb-3 font-sans text-xs font-bold tracking-normal uppercase">
        {t("number-systems.simulator.arithmetic.subtraction.step2")}
      </p>
      <div className="space-y-2">
        {twosSteps.map((step, idx) => (
          <CollapsibleStep
            key={idx}
            isOpen={expanded.has(String(idx))}
            onToggle={() => toggle(String(idx))}
            header={
              <div className="flex items-center gap-4 font-mono text-sm">
                <span className="text-muted-foreground w-16 text-xs">
                  {t("number-systems.simulator.arithmetic.subtraction.bitN", {
                    n: step.position,
                  })}
                </span>
                <span className="bg-destructive/10 text-destructive flex h-6 w-8 items-center justify-center rounded">
                  {step.currentBit}
                </span>
                <span className="text-muted-foreground">+1</span>
                <span className="flex h-6 w-8 items-center justify-center rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                  {step.carryIn}
                </span>
                <span className="text-muted-foreground">=</span>
                <span className="bg-primary/10 text-primary flex h-6 w-8 items-center justify-center rounded font-bold">
                  {step.resultBit}
                </span>
                {step.carryOut > 0 && (
                  <>
                    <span className="text-muted-foreground mx-1">→</span>
                    <span className="bg-destructive/10 text-destructive flex h-6 w-8 items-center justify-center rounded">
                      {step.carryOut}
                    </span>
                  </>
                )}
              </div>
            }
          >
            <p className="text-muted-foreground text-xs">{step.explanation}</p>
          </CollapsibleStep>
        ))}
      </div>
      <div className="border-border/40 mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-muted-foreground text-sm">
          {t("number-systems.simulator.arithmetic.subtraction.twosResult")}
        </span>
        <span className="text-primary font-mono font-bold">{twosComp}</span>
      </div>
    </div>
  );
}

function StepThreeAddition({
  t,
  addSteps,
  expanded,
  toggle,
}: {
  t: TFunction<"translation", undefined>;
  addSteps: AddStep[];
  expanded: Set<string>;
  toggle: (id: string) => void;
}) {
  return (
    <div className="bg-background border-border/40 rounded-lg border p-4 shadow-inner">
      <p className="text-muted-foreground mb-3 font-sans text-xs font-bold tracking-normal uppercase">
        {t("number-systems.simulator.arithmetic.subtraction.step3")}
      </p>
      <div className="space-y-2">
        {addSteps.map((step, idx) => (
          <CollapsibleStep
            key={idx}
            isOpen={expanded.has(String(idx))}
            onToggle={() => toggle(String(idx))}
            header={
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="text-muted-foreground w-16 text-xs">
                  {t("number-systems.simulator.arithmetic.subtraction.bitN", {
                    n: step.position,
                  })}
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/10">
                  {step.bitA}
                </span>
                <span>+</span>
                <span className="flex h-6 w-6 items-center justify-center rounded bg-green-500/10">
                  {step.bitB}
                </span>
                <span>+</span>
                <span className="flex h-6 w-6 items-center justify-center rounded bg-yellow-500/10">
                  {step.carryIn}
                </span>
                <span>=</span>
                <span className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded font-bold">
                  {step.sum}
                </span>
                {step.carryOut > 0 && (
                  <>
                    <span className="text-muted-foreground mx-1">→</span>
                    <span className="bg-destructive/10 text-destructive flex h-6 w-6 items-center justify-center rounded">
                      {step.carryOut}
                    </span>
                  </>
                )}
              </div>
            }
          >
            <p className="text-muted-foreground text-xs">{step.explanation}</p>
          </CollapsibleStep>
        ))}
      </div>
    </div>
  );
}

function StepSummary({
  t,
  padB,
  onesComp,
  twosComp,
}: {
  t: TFunction<"translation", undefined>;
  padB: string;
  onesComp: string;
  twosComp: string;
}) {
  return (
    <div className="bg-background border-border/40 space-y-4 rounded-lg border p-4 font-mono text-sm tracking-widest shadow-inner">
      <div className="space-y-1">
        <p className="text-muted-foreground font-sans text-xs font-bold tracking-normal uppercase">
          {t("number-systems.simulator.arithmetic.subtraction.step1")}
        </p>
        <div className="flex gap-4">
          <span className="opacity-50">{padB}</span>
          <ArrowRight className="h-4 w-4 opacity-50" />
          <span className="text-destructive font-semibold">{onesComp}</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-muted-foreground mt-2 font-sans text-xs font-bold tracking-normal uppercase">
          {t("number-systems.simulator.arithmetic.subtraction.step2")}
        </p>
        <div className="flex gap-4">
          <span className="text-destructive opacity-50">{onesComp}</span>
          <span className="text-primary opacity-50">+ 00000001</span>
          <ArrowRight className="h-4 w-4 opacity-50" />
          <span className="text-primary font-bold">{twosComp}</span>
        </div>
      </div>
    </div>
  );
}

function AdditionGrid({
  padA,
  twosComp,
  sum,
  carries,
  carryOut,
}: {
  padA: string;
  twosComp: string;
  sum: string;
  carries: number[];
  carryOut: boolean;
}) {
  return (
    <>
      <p className="text-muted-foreground border-border/50 mt-6 border-b pb-2 font-sans text-xs font-bold tracking-normal uppercase">
        Subtraktion
      </p>
      <div className="flex justify-center p-4">
        <div className="bg-background border-border/40 rounded-lg border p-6 font-mono text-lg leading-loose font-medium tracking-widest shadow-inner select-none md:text-xl">
          <div className="text-destructive flex gap-2 text-sm">
            <span className="w-4" />
            <span className="mr-2 w-4" />
            {carries.slice(0, 8).map((c, i) => (
              <span
                key={i}
                className={`w-4 text-center ${c ? "font-bold opacity-100" : "opacity-20"}`}
              >
                {c}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <span className="w-4 text-center" />
            <span className="mr-2 w-4 text-center" />
            {padA.split("").map((b, i) => (
              <span key={`a-${i}`} className="w-4 text-center">
                {b}
              </span>
            ))}
          </div>
          <div className="border-foreground/30 mb-2 flex gap-2 border-b-2 pb-2">
            <span className="text-primary mr-2 w-4 text-center">+</span>
            <span className="w-4 text-center" />
            {twosComp.split("").map((b, i) => (
              <span key={`b-${i}`} className="w-4 text-center">
                {b}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <span className="w-4 text-center" />
            <span
              className={`mr-2 w-4 text-center ${carryOut ? "text-destructive font-bold" : "text-muted-foreground opacity-20"}`}
            >
              {carries[0]}
            </span>
            {sum.split("").map((b, i) => (
              <span
                key={`s-${i}`}
                className="text-primary w-4 text-center font-bold"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

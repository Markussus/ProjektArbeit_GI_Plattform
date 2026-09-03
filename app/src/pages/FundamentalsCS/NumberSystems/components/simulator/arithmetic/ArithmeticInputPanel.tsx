import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import type { TFunction } from "i18next";
import { BinaryInput } from "@/components/shared/SimulatorShared";

interface ArithmeticInputPanelProps {
  titleKey: string;
  descKey: string;
  renderModeSelector?: ReactNode;
  operandA: {
    value: string;
    onChange: (value: string) => void;
    labelKey: string;
  };
  operandB: {
    value: string;
    onChange: (value: string) => void;
    labelKey: string;
  };
  locked: boolean;
  t?: TFunction<"translation", undefined>;
}

export function ArithmeticInputPanel({
  titleKey,
  descKey,
  renderModeSelector,
  operandA,
  operandB,
  locked,
  t: externalT,
}: ArithmeticInputPanelProps) {
  const { t: hookT } = useTranslation("translation");
  const t = externalT ?? hookT;

  return (
    <>
      <div>
        <h3 className="text-foreground mb-2 flex items-center gap-2 text-lg font-semibold">
          {t(titleKey as never)}
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          {t(descKey as never)}
        </p>
      </div>
      <div className="space-y-4">
        {renderModeSelector}
        <BinaryInput
          label={t(operandA.labelKey as never)}
          value={operandA.value}
          onChange={operandA.onChange}
          locked={locked}
        />
        <BinaryInput
          label={t(operandB.labelKey as never)}
          value={operandB.value}
          onChange={operandB.onChange}
          locked={locked}
        />
      </div>
    </>
  );
}

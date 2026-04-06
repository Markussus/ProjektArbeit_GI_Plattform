import { useTranslation } from "react-i18next";
import { BookOpen, Lightbulb, Layers, Cpu } from "lucide-react";

const conceptIcons = [BookOpen, Layers, Lightbulb, Cpu];

export function OverviewTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
        <h3 className="text-foreground text-lg font-semibold">
          {t("number.overviewTitle")}
        </h3>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {t("number.overviewText")}
        </p>
      </div>

      <div>
        <h3 className="text-muted-foreground mb-3 text-sm font-bold tracking-wider uppercase">
          {t("number.concepts")}
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          {([1, 2, 3, 4] as const).map((num, i) => {
            const Icon = conceptIcons[i];

            return (
              <div
                key={num}
                className="bg-card ring-foreground/10 flex items-center gap-3 rounded-lg p-4 ring-1"
              >
                <div className="bg-module-purple-bg text-module-purple-fg flex size-9 shrink-0 items-center justify-center rounded-md">
                  <Icon className="size-4" />
                </div>

                <span className="text-foreground text-sm font-medium">
                  {t(`number.concept${num}`)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

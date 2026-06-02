import { useEffect } from "react";
import { BookOpen, Code2, ListChecks, PlayCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { JavaCompilerStatusBadge } from "./JavaCompilerStatusBadge";
import { useJavaExecutionContext } from "./Simulator/application/javaExecutionContextValue";

const conceptIcons = [BookOpen, Code2, PlayCircle, ListChecks];

export function OverviewTab() {
  const { t } = useTranslation();
  const { snapshot, preload } = useJavaExecutionContext();

  useEffect(() => {
    preload();
  }, [preload]);

  return (
    <div className="space-y-6">
      <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-foreground text-lg font-semibold">
            {t("java.overviewTitle")}
          </h3>
          <JavaCompilerStatusBadge status={snapshot.compilerStatus} />
        </div>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {t("java.overviewText")}
        </p>
        <p className="text-muted-foreground mt-4 text-sm">
          {t(`java.compilerStatusText.${snapshot.compilerStatus}`)}
        </p>
      </div>

      <div>
        <h3 className="text-muted-foreground mb-3 text-sm font-bold tracking-wider uppercase">
          {t("java.concepts")}
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          {([1, 2, 3, 4] as const).map((num, index) => {
            const Icon = conceptIcons[index];

            return (
              <div
                key={num}
                className="bg-card ring-foreground/10 flex items-center gap-3 rounded-lg p-4 ring-1"
              >
                <div className="bg-module-orange-bg text-module-orange-fg flex size-9 shrink-0 items-center justify-center rounded-md">
                  <Icon className="size-4" />
                </div>

                <span className="text-foreground text-sm font-medium">
                  {t(`java.concept${num}`)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

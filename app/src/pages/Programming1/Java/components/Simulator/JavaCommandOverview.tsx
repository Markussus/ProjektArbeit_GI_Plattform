import { Info, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popup } from "@/components/shared/Popup/Popup";
import { cn } from "@/lib/utils";
import {
  JAVA_COMPILER_CAPABILITIES,
  JAVA_COMPILER_VERSION_INFO,
  type JavaCompilerSupportStatus,
} from "./domain/javaCompilerCapabilities";

interface JavaCommandOverviewProps {
  open: boolean;
  onClose: () => void;
}

const statusClassNames: Record<JavaCompilerSupportStatus, string> = {
  supported:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  limited:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  blocked: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200",
};

export function JavaCommandOverview({
  open,
  onClose,
}: JavaCommandOverviewProps) {
  const { t } = useTranslation();
  const translate = (key: string) => t(key as never);

  return (
    <Popup
      open={open}
      title={t("java.commandOverview.title")}
      onClose={onClose}
      testId="java-command-overview-dialog"
    >
      <div className="space-y-4">
        <div className="border-border bg-muted/40 rounded-lg border p-3">
          <div className="flex items-start gap-3">
            <Info className="text-muted-foreground mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                {t("java.commandOverview.summary", {
                  version: JAVA_COMPILER_VERSION_INFO.javaVersion,
                })}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("java.commandOverview.limitationsText")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ListChecks className="text-muted-foreground size-4" />
            <h3 className="text-sm font-semibold">
              {t("java.commandOverview.commandListTitle")}
            </h3>
          </div>

          <div className="grid gap-2">
            {JAVA_COMPILER_CAPABILITIES.map((capability) => (
              <article
                key={capability.id}
                className="border-border bg-background rounded-lg border p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {translate(capability.titleKey)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {translate(capability.descriptionKey)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold",
                      statusClassNames[capability.status],
                    )}
                  >
                    {t(`java.commandOverview.status.${capability.status}`)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {capability.examples.map((example) => (
                    <code
                      key={example}
                      className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs"
                    >
                      {example}
                    </code>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </Popup>
  );
}

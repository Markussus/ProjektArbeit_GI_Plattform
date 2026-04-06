import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronRight, Layers3 } from "lucide-react";
import { learningModules, type TopicAccent } from "@/data/modules";
import { cn } from "@/lib/utils";

function getAccentClasses(accent: TopicAccent) {
  return {
    orange: "bg-module-orange-bg text-module-orange-fg",
    blue: "bg-module-blue-bg text-module-blue-fg",
    purple: "bg-module-purple-bg text-module-purple-fg",
    green: "bg-module-green-bg text-module-green-fg",
    rose: "bg-module-rose-bg text-module-rose-fg",
  }[accent];
}

export function FundamentalsCSPage() {
  const { t } = useTranslation();
  const tk = (key: string) => t(key as never);

  const moduleData = learningModules.find(
    (module) => module.id === "fundamentals-cs",
  );

  if (!moduleData) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-brand text-sm font-semibold tracking-wide uppercase">
          {t("modules.label")}
        </p>

        <h1 className="text-foreground mt-2 text-5xl font-bold tracking-tight">
          {tk(moduleData.titleKey)}
        </h1>

        <p className="text-muted-foreground mt-4 max-w-3xl text-lg leading-relaxed">
          {tk(moduleData.descriptionKey)}
        </p>
      </div>

      <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
        <div className="mb-4 flex items-center gap-3">
          <Layers3 className="text-muted-foreground size-5" />
          <h2 className="text-foreground text-lg font-semibold">
            {t("modules.topicsTitle")}
          </h2>
        </div>

        <div className="divide-border divide-y">
          {moduleData.topics.map((topic) => {
            const Icon = topic.icon;

            return (
              <Link
                key={topic.id}
                to={topic.path}
                className="hover:bg-muted/40 flex items-center justify-between gap-4 px-1 py-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg",
                      getAccentClasses(topic.accent),
                    )}
                  >
                    <Icon className="size-5" />
                  </div>

                  <div>
                    <p className="text-foreground text-base font-semibold">
                      {tk(topic.titleKey)}
                    </p>

                    {topic.descriptionKey && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {tk(topic.descriptionKey)}
                      </p>
                    )}
                  </div>
                </div>

                <ChevronRight className="text-muted-foreground size-4 shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

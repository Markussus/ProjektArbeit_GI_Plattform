import { ChevronRight, Layers3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageIntro } from "@/components/shared/PageIntro/PageIntro";
import { learningModules, type TopicAccent } from "@/data/moduleCatalogData";
import { cn } from "@/lib/utils";

interface ModuleOverviewPageProps {
  moduleId: string;
}

function getAccentClasses(accent: TopicAccent) {
  return {
    orange: "bg-module-orange-bg text-module-orange-fg",
    blue: "bg-module-blue-bg text-module-blue-fg",
    purple: "bg-module-purple-bg text-module-purple-fg",
    green: "bg-module-green-bg text-module-green-fg",
    rose: "bg-module-rose-bg text-module-rose-fg",
  }[accent];
}

export function ModuleOverviewPage({ moduleId }: ModuleOverviewPageProps) {
  const { t } = useTranslation();
  const moduleData = learningModules.find((module) => module.id === moduleId);

  if (!moduleData) {
    return null;
  }

  return (
    <div className="p-8">
      <PageIntro
        eyebrow={t("common.modules.label")}
        title={t(moduleData.titleKey)}
        description={t(moduleData.descriptionKey)}
      />

      <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
        <div className="mb-4 flex items-center gap-3">
          <Layers3 className="text-muted-foreground size-5" />
          <h2 className="text-foreground text-lg font-semibold">
            {t("common.modules.topicsTitle")}
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
                      {t(topic.titleKey)}
                    </p>

                    {topic.descriptionKey && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {t(topic.descriptionKey)}
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

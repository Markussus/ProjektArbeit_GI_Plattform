import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { useTranslation } from "react-i18next";

export function ExamplesTab(props: ModuleExamplesTabProps) {
  void props;
  const { t } = useTranslation("translation");
  return (
    <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
      <p className="text-muted-foreground text-sm">
        {t(
          "number.examplesFallback",
          "Interactive examples for Number Systems will be available here.",
        )}
      </p>
    </div>
  );
}

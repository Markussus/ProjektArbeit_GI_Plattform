import { useTranslation } from "react-i18next";

export function ExamplesTab() {
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

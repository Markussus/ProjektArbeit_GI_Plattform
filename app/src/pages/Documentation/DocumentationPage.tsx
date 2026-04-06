import { useTranslation } from "react-i18next";
import { FileText, BookOpen, Wrench } from "lucide-react";

export function DocumentationPage() {
  const { t } = useTranslation();

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-brand text-sm font-semibold tracking-wide uppercase">
          {t("documentation.label")}
        </p>
        <h1 className="text-foreground mt-2 text-5xl font-bold tracking-tight">
          {t("documentation.title")}
        </h1>
        <p className="text-muted-foreground mt-4 max-w-3xl text-lg leading-relaxed">
          {t("documentation.description")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
          <FileText className="text-muted-foreground size-5" />
          <h2 className="text-foreground mt-4 text-lg font-semibold">
            {t("documentation.section1Title")}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("documentation.section1Text")}
          </p>
        </div>

        <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
          <BookOpen className="text-muted-foreground size-5" />
          <h2 className="text-foreground mt-4 text-lg font-semibold">
            {t("documentation.section2Title")}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("documentation.section2Text")}
          </p>
        </div>

        <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
          <Wrench className="text-muted-foreground size-5" />
          <h2 className="text-foreground mt-4 text-lg font-semibold">
            {t("documentation.section3Title")}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("documentation.section3Text")}
          </p>
        </div>
      </div>
    </div>
  );
}

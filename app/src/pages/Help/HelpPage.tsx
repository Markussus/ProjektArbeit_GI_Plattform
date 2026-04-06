import { useTranslation } from "react-i18next";
import { HelpCircle, LifeBuoy, MessageSquareWarning } from "lucide-react";

export function HelpPage() {
  const { t } = useTranslation();

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-brand uppercase">
          {t("help.label")}
        </p>
        <h1 className="mt-2 text-5xl font-bold tracking-tight text-foreground">
          {t("help.title")}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          {t("help.description")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
          <HelpCircle className="size-5 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            {t("help.section1Title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("help.section1Text")}
          </p>
        </div>

        <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
          <LifeBuoy className="size-5 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            {t("help.section2Title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("help.section2Text")}
          </p>
        </div>

        <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
          <MessageSquareWarning className="size-5 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            {t("help.section3Title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("help.section3Text")}
          </p>
        </div>
      </div>
    </div>
  );
}

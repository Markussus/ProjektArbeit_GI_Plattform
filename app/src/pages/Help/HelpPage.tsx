import { useTranslation } from "react-i18next";
import { HelpCircle, LifeBuoy, MessageSquareWarning } from "lucide-react";
import { InfoCardGrid } from "@/components/shared/InfoCardGrid/InfoCardGrid";
import { InlineResetControl } from "@/components/shared/InlineResetControl";
import { PageIntro } from "@/components/shared/PageIntro/PageIntro";
import { trainingCenterStorage } from "@/lib/trainingCenter";

export function HelpPage() {
  const { t } = useTranslation();
  const cards = [
    {
      id: "getting-started",
      icon: HelpCircle,
      title: t("help.section1Title"),
      description: t("help.section1Text"),
    },
    {
      id: "support",
      icon: LifeBuoy,
      title: t("help.section2Title"),
      description: t("help.section2Text"),
    },
    {
      id: "troubleshooting",
      icon: MessageSquareWarning,
      title: t("help.section3Title"),
      description: t("help.section3Text"),
    },
  ];

  return (
    <div data-testid="help-page" className="p-8">
      <PageIntro
        eyebrow={t("help.label")}
        title={t("help.title")}
        description={t("help.description")}
      />
      <InfoCardGrid cards={cards} />
      <section className="bg-card ring-foreground/10 mt-6 rounded-xl p-6 ring-1">
        <h2 className="text-foreground text-lg font-semibold">
          {t("trainingCenter.resetAllProgressTitle")}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {t("trainingCenter.resetAllProgressDescription")}
        </p>
        <div className="mt-4">
          <InlineResetControl
            label={t("trainingCenter.resetAllProgress")}
            confirmationText={t("trainingCenter.confirmResetAllProgress")}
            onConfirm={() => trainingCenterStorage.deleteAll()}
            testId="help-reset-all-progress"
          />
        </div>
      </section>
    </div>
  );
}

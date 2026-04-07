import { useTranslation } from "react-i18next";
import { HelpCircle, LifeBuoy, MessageSquareWarning } from "lucide-react";
import { InfoCardGrid } from "@/components/shared/InfoCardGrid/InfoCardGrid";
import { PageIntro } from "@/components/shared/PageIntro/PageIntro";

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
    <div className="p-8">
      <PageIntro
        eyebrow={t("help.label")}
        title={t("help.title")}
        description={t("help.description")}
      />
      <InfoCardGrid cards={cards} />
    </div>
  );
}

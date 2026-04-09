import { useTranslation } from "react-i18next";
import { FileText, BookOpen, Wrench } from "lucide-react";
import { InfoCardGrid } from "@/components/shared/InfoCardGrid/InfoCardGrid";
import { PageIntro } from "@/components/shared/PageIntro/PageIntro";

export function DocumentationPage() {
  const { t } = useTranslation();
  const cards = [
    {
      id: "platform-overview",
      icon: FileText,
      title: t("documentation.section1Title"),
      description: t("documentation.section1Text"),
    },
    {
      id: "module-notes",
      icon: BookOpen,
      title: t("documentation.section2Title"),
      description: t("documentation.section2Text"),
    },
    {
      id: "technical-notes",
      icon: Wrench,
      title: t("documentation.section3Title"),
      description: t("documentation.section3Text"),
    },
  ];

  return (
    <div className="p-8">
      <PageIntro
        eyebrow={t("documentation.label")}
        title={t("documentation.title")}
        description={t("documentation.description")}
      />
      <InfoCardGrid cards={cards} />
    </div>
  );
}

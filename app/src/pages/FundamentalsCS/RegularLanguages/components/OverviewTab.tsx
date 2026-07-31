import { useTranslation } from "react-i18next";

/**
 * Regular Languages overview. The "Core Concepts" card grid was removed — a
 * tutorial video takes that spot (see the `develop/video_player` branch, which
 * adds the shared `TopicTutorialVideoSection`).
 */
export function OverviewTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
        <h3 className="text-foreground text-lg font-semibold">
          {t("rl.overviewTitle")}
        </h3>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {t("rl.overviewText")}
        </p>
      </div>
    </div>
  );
}

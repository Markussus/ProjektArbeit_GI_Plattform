import { useTranslation } from "react-i18next";
import { TopicTutorialVideoSection } from "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection";

const tutorialQuestions = [
  {
    titleKey: "automata.tutorialQuestion1",
    answerKey: "automata.tutorialAnswer1",
  },
  {
    titleKey: "automata.tutorialQuestion2",
    answerKey: "automata.tutorialAnswer2",
  },
  {
    titleKey: "automata.tutorialQuestion3",
    answerKey: "automata.tutorialAnswer3",
  },
] as const;

/**
 * Finite Automata overview. The "Core Concepts" card grid was removed — a
 * tutorial video takes that spot (see the `develop/video_player` branch, which
 * adds the shared `TopicTutorialVideoSection`).
 */
export function OverviewTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
        <h3 className="text-foreground text-lg font-semibold">
          {t("automata.overviewTitle")}
        </h3>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {t("automata.overviewText")}
        </p>
      </div>

      <TopicTutorialVideoSection
        topicId="finite-automata"
        videoTitleKey="automata.tutorialVideo"
        questionLabelKey="automata.tutorialQuestionLabel"
        questions={tutorialQuestions}
        testIdPrefix="automata-tutorial"
      />
    </div>
  );
}

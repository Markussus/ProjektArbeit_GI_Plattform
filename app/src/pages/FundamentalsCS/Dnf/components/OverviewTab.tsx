import { TopicTutorialVideoSection } from "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection";

const tutorialQuestions = [
  {
    titleKey: "dnf.tutorialQuestion1",
    answerKey: "dnf.tutorialAnswer1",
  },
  {
    titleKey: "dnf.tutorialQuestion2",
    answerKey: "dnf.tutorialAnswer2",
  },
  {
    titleKey: "dnf.tutorialQuestion3",
    answerKey: "dnf.tutorialAnswer3",
  },
] as const;

export function OverviewTab() {
  return (
    <div className="space-y-6">
      <TopicTutorialVideoSection
        topicId="dnf"
        videoTitleKey="dnf.tutorialVideo"
        questionLabelKey="dnf.tutorialQuestionLabel"
        questions={tutorialQuestions}
        testIdPrefix="dnf-tutorial"
      />
    </div>
  );
}

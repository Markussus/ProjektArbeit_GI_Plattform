import { TopicTutorialVideoSection } from "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection";

const tutorialQuestions = [
  {
    titleKey: "number.tutorialQuestion1",
    answerKey: "number.tutorialAnswer1",
  },
  {
    titleKey: "number.tutorialQuestion2",
    answerKey: "number.tutorialAnswer2",
  },
  {
    titleKey: "number.tutorialQuestion3",
    answerKey: "number.tutorialAnswer3",
  },
] as const;

export function OverviewTab() {
  return (
    <div className="space-y-6">
      <TopicTutorialVideoSection
        topicId="number-systems"
        videoTitleKey="number.tutorialVideo"
        questionLabelKey="number.tutorialQuestionLabel"
        questions={tutorialQuestions}
        testIdPrefix="number-tutorial"
      />
    </div>
  );
}

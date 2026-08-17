import { TopicTutorialVideoSection } from "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection";

const tutorialQuestions = [
  {
    titleKey: "moore.tutorialQuestion1",
    answerKey: "moore.tutorialAnswer1",
  },
  {
    titleKey: "moore.tutorialQuestion2",
    answerKey: "moore.tutorialAnswer2",
  },
  {
    titleKey: "moore.tutorialQuestion3",
    answerKey: "moore.tutorialAnswer3",
  },
] as const;

export function OverviewTab() {
  return (
    <div className="space-y-6">
      <TopicTutorialVideoSection
        topicId="moore-mealy"
        videoTitleKey="moore.tutorialVideo"
        questionLabelKey="moore.tutorialQuestionLabel"
        questions={tutorialQuestions}
        testIdPrefix="moore-tutorial"
      />
    </div>
  );
}

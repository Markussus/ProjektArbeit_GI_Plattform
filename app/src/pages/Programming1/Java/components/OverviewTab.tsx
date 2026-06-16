import { TopicTutorialVideoSection } from "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection";

const tutorialQuestions = [
  {
    titleKey: "java.tutorialQuestion1",
    answerKey: "java.tutorialAnswer1",
  },
  {
    titleKey: "java.tutorialQuestion2",
    answerKey: "java.tutorialAnswer2",
  },
  {
    titleKey: "java.tutorialQuestion3",
    answerKey: "java.tutorialAnswer3",
  },
] as const;

export function OverviewTab() {
  return (
    <div className="space-y-6">
      <TopicTutorialVideoSection
        topicId="java-programming"
        videoTitleKey="java.tutorialVideo"
        questionLabelKey="java.tutorialQuestionLabel"
        questions={tutorialQuestions}
        testIdPrefix="java-tutorial"
      />
    </div>
  );
}

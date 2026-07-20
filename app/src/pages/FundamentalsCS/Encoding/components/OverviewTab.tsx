import { TopicTutorialVideoSection } from "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection";

const tutorialQuestions = [
  {
    titleKey: "encoding.tutorialQuestion1",
    answerKey: "encoding.tutorialAnswer1",
  },
  {
    titleKey: "encoding.tutorialQuestion2",
    answerKey: "encoding.tutorialAnswer2",
  },
  {
    titleKey: "encoding.tutorialQuestion3",
    answerKey: "encoding.tutorialAnswer3",
  },
] as const;

export function OverviewTab() {
  return (
    <div className="space-y-6">
      <TopicTutorialVideoSection
        topicId="encoding"
        videoTitleKey="encoding.tutorialVideo"
        questionLabelKey="encoding.tutorialQuestionLabel"
        questions={tutorialQuestions}
        testIdPrefix="encoding-tutorial"
      />
    </div>
  );
}

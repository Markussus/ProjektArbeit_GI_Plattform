import { TopicTutorialVideoSection } from "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection";

export function OverviewTab() {
  return (
    <div className="space-y-6">
      <TopicTutorialVideoSection
        topicId="finite-automata"
        videoTitleKey="finite-automata.topic.tutorialVideo"
        testIdPrefix="automata-tutorial"
      />
    </div>
  );
}

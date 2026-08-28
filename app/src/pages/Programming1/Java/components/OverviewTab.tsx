import { TopicTutorialVideoSection } from "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection";

export function OverviewTab() {
  return (
    <div className="space-y-6">
      <TopicTutorialVideoSection
        topicId="java-programming"
        videoTitleKey="java-programming.tutorialVideo"
        testIdPrefix="java-tutorial"
      />
    </div>
  );
}

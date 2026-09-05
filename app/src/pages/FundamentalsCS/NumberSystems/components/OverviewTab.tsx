import { TopicTutorialVideoSection } from "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection";

export function OverviewTab() {
  return (
    <div className="space-y-6">
      <TopicTutorialVideoSection
        topicId="number-systems"
        videoTitleKey="number-systems.tutorialVideo"
        testIdPrefix="number-tutorial"
      />
    </div>
  );
}

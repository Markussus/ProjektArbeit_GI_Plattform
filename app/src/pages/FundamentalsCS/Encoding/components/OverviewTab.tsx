import { TopicTutorialVideoSection } from "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection";

export function OverviewTab() {
  return (
    <div className="space-y-6">
      <TopicTutorialVideoSection
        topicId="encoding"
        videoTitleKey="encoding.tutorialVideo"
        testIdPrefix="encoding-tutorial"
      />
    </div>
  );
}

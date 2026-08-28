import { TopicTutorialVideoSection } from "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection";

export function OverviewTab() {
  return (
    <div className="space-y-6">
      <TopicTutorialVideoSection
        topicId="moore-mealy"
        videoTitleKey="moore-mealy.tutorialVideo"
        testIdPrefix="moore-tutorial"
      />
    </div>
  );
}

import { TopicTutorialVideoSection } from "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection";

export function OverviewTab() {
  return (
    <div className="space-y-6">
      <TopicTutorialVideoSection
        topicId="dnf"
        videoTitleKey="dnf.tutorialVideo"
        testIdPrefix="dnf-tutorial"
      />
    </div>
  );
}

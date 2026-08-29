import { TopicTutorialVideoSection } from "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection";

export function OverviewTab() {
  return (
    <div className="space-y-6">
      <TopicTutorialVideoSection
        topicId="regular-languages"
        videoTitleKey="regular-languages.tutorialVideo"
        testIdPrefix="rl-tutorial"
      />
    </div>
  );
}

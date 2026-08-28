import { TopicTutorialVideoSection } from "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection";

export function OverviewTab() {
  return (
    <div className="space-y-6">
      <TopicTutorialVideoSection
        topicId="turing-machine"
        videoTitleKey="tm.overview.tutorialVideo"
        testIdPrefix="tm-tutorial"
      />
    </div>
  );
}

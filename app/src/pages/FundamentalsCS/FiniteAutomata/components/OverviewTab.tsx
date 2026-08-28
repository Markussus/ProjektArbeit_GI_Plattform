import { TopicTutorialVideoSection } from "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection";

export function OverviewTab() {
  return (
    <div className="space-y-6">
      <TopicTutorialVideoSection
        topicId="finite-automata"
        videoTitleKey="automata.tutorialVideo"
        testIdPrefix="automata-tutorial"
      />
    </div>
  );
}

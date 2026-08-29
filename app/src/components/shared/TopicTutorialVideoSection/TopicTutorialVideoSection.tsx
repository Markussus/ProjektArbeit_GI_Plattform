import { useTranslation } from "react-i18next";
import { VideoPlayer } from "@/components/shared/VideoPlayer/VideoPlayer";
import { findTopicById } from "@/data/moduleCatalog";
import type { TranslationKey } from "@/types/i18n";

interface TopicTutorialVideoSectionProps {
  topicId: string;
  videoTitleKey: TranslationKey;
  testIdPrefix?: string;
}

export function TopicTutorialVideoSection({
  topicId,
  videoTitleKey,
  testIdPrefix = "topic-tutorial",
}: TopicTutorialVideoSectionProps) {
  const { t } = useTranslation();
  const topic = findTopicById(topicId);

  if (!topic?.tutorialVideoUrl) {
    return null;
  }

  return (
    <div className="bg-card ring-foreground/10 mx-auto flex w-full max-w-158.5 rounded-lg p-4 ring-1">
      <VideoPlayer
        url={topic.tutorialVideoUrl}
        title={t(videoTitleKey)}
        testId={`${testIdPrefix}-video`}
        className="max-w-none"
      />
    </div>
  );
}

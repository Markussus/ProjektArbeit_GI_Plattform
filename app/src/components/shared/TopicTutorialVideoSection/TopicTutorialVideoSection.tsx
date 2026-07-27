import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import { VideoPlayer } from "@/components/shared/VideoPlayer/VideoPlayer";
import { findTopicById } from "@/data/moduleCatalog";
import type { Example } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";

export interface TopicTutorialQuestion {
  titleKey: TranslationKey;
  answerKey: TranslationKey;
}

interface TopicTutorialVideoSectionProps {
  topicId: string;
  videoTitleKey: TranslationKey;
  questionLabelKey: TranslationKey;
  questions: readonly TopicTutorialQuestion[];
  testIdPrefix?: string;
}

export function TopicTutorialVideoSection({
  topicId,
  videoTitleKey,
  questionLabelKey,
  questions,
  testIdPrefix = "topic-tutorial",
}: TopicTutorialVideoSectionProps) {
  const { t } = useTranslation();
  const topic = findTopicById(topicId);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );

  if (!topic?.tutorialVideoUrl) {
    return null;
  }

  const items: Example[] = questions.map((question) => ({
    id: question.titleKey,
    title: t(question.titleKey),
    description: t(question.answerKey),
    icon: topic.icon,
    kind: "example",
  }));

  return (
    <section>
      <div
        data-testid={`${testIdPrefix}-questions`}
        className="bg-card ring-foreground/10 mb-4 overflow-hidden rounded-xl ring-1"
      >
        {items.map((question, index) => (
          <ExerciseCard
            key={question.id}
            item={question}
            index={index}
            label={t(questionLabelKey, { index: index + 1 })}
            testIdPrefix={`${testIdPrefix}-question-${index + 1}`}
            isSelected={selectedQuestionId === question.id}
            onSelect={() =>
              setSelectedQuestionId((current) =>
                current === question.id ? null : question.id,
              )
            }
          />
        ))}
      </div>

      <div className="bg-card ring-foreground/10 mx-auto flex w-full max-w-158.5 rounded-lg p-4 ring-1">
        <VideoPlayer
          url={topic.tutorialVideoUrl}
          title={t(videoTitleKey)}
          tracks={topic.tutorialVideoTracks}
          testId={`${testIdPrefix}-video`}
          className="max-w-none"
        />
      </div>
    </section>
  );
}

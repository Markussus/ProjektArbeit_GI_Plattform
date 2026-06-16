import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Cpu, GitBranch } from "lucide-react";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import { VideoPlayer } from "@/components/shared/VideoPlayer/VideoPlayer";
import { findTopicById } from "@/data/moduleCatalog";
import type { Example } from "@/types/exercise";

const tutorialQuestions = [
  {
    titleKey: "moore.tutorialQuestion1",
    descriptionKey: "moore.tutorialAnswer1",
    icon: Cpu,
  },
  {
    titleKey: "moore.tutorialQuestion2",
    descriptionKey: "moore.tutorialAnswer2",
    icon: GitBranch,
  },
  {
    titleKey: "moore.tutorialQuestion3",
    descriptionKey: "moore.tutorialAnswer3",
    icon: GitBranch,
  },
] as const;

export function OverviewTab() {
  const { t } = useTranslation();
  const tutorialVideoUrl = findTopicById("moore-mealy")?.tutorialVideoUrl;
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const questions: Example[] = tutorialQuestions.map((question) => ({
    id: question.titleKey,
    title: t(question.titleKey),
    description: t(question.descriptionKey),
    icon: question.icon,
    kind: "example",
  }));

  return (
    <div className="space-y-6">
      {tutorialVideoUrl && (
        <section>
          <div
            data-testid="moore-tutorial-questions"
            className="bg-card ring-foreground/10 mb-4 overflow-hidden rounded-xl ring-1"
          >
            {questions.map((question, index) => (
              <ExerciseCard
                key={question.id}
                item={question}
                index={index}
                label={t("moore.tutorialQuestionLabel", { index: index + 1 })}
                testIdPrefix={`moore-tutorial-question-${index + 1}`}
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
              url={tutorialVideoUrl}
              title={t("moore.tutorialVideo")}
              testId="moore-tutorial-video"
              className="max-w-none"
            />
          </div>
        </section>
      )}
    </div>
  );
}

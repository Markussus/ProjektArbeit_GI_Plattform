import type { ReactNode } from "react";

interface TopicCategorySectionProps {
  title: string;
  /** Optional one-line explanation of what this group of tasks covers. */
  description?: string;
  /** The cards belonging to this category. */
  children: ReactNode;
  testId?: string;
}

/**
 * One titled group inside an examples or exercises tab, so a learner can see
 * at a glance that a block contains only "Grammar → Language" tasks, only
 * "Language → Grammar" tasks, and so on.
 */
export function TopicCategorySection({
  title,
  description,
  children,
  testId,
}: TopicCategorySectionProps) {
  return (
    <section data-testid={testId} className="flex flex-col gap-2">
      <div>
        <h3 className="text-foreground text-sm font-bold">{title}</h3>
        {description && (
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1">
        {children}
      </div>
    </section>
  );
}

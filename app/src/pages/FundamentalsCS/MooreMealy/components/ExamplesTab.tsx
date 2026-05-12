import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";

export function ExamplesTab(props: ModuleExamplesTabProps) {
  void props;
  return (
    <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
      <p className="text-muted-foreground text-sm">
        Interactive examples for Moore & Mealy machines will be available here.
      </p>
    </div>
  );
}

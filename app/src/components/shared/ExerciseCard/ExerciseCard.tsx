import { useId } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TopicItem } from "@/types/exercise";

interface ExerciseCardProps {
  item: TopicItem;
  index: number;
  isSelected?: boolean;
  label?: string;
  onSelect?: () => void;
  onOpen?: () => void;
  testIdPrefix?: string;
}

const difficultyTextColors = {
  easy: "text-difficulty-easy",
  medium: "text-difficulty-medium",
  hard: "text-difficulty-hard",
};

const difficultyBorderColors = {
  easy: "border-l-green-500",
  medium: "border-l-orange-500",
  hard: "border-l-red-500",
};

export function ExerciseCard({
  item,
  index,
  isSelected = false,
  label,
  onSelect,
  onOpen,
  testIdPrefix,
}: ExerciseCardProps) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const detailsId = useId();
  const itemTitle = item.titleKey ? t(item.titleKey) : item.title;
  const rawDescription = item.descriptionKey
    ? t(item.descriptionKey, item.descriptionParams || {})
    : item.description;
  const itemDescription = item.descriptionParams
    ? Object.entries(item.descriptionParams).reduce(
        (desc, [key, value]) => desc.replace(`{{${key}}}`, String(value)),
        rawDescription,
      )
    : rawDescription;
  const itemLabel =
    label ??
    (item.kind === "example"
      ? t("common.example.label", { index: index + 1 })
      : t("common.exercise.label", { index: index + 1 }));
  const openLabel =
    item.kind === "example"
      ? t("common.example.openInSimulation")
      : t("common.exercise.openInSimulation");

  return (
    <div
      data-testid={testIdPrefix}
      data-item-id={item.id}
      data-selected={isSelected}
      className={cn(
        "border-border border-b last:border-b-0",
        isSelected && "border-l-[3px]",
        isSelected &&
          item.kind === "exercise" &&
          difficultyBorderColors[item.difficulty],
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        onDoubleClick={onOpen}
        data-testid={testIdPrefix ? `${testIdPrefix}-select` : undefined}
        aria-expanded={isSelected}
        aria-controls={detailsId}
        className={cn(
          "hover:bg-muted/50 focus-visible:ring-ring flex w-full items-center gap-4 p-4 text-left focus-visible:ring-2 focus-visible:outline-none",
          isSelected && "bg-muted/30",
        )}
      >
        <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-semibold">
            {itemLabel}: {itemTitle}
          </p>

          {item.kind === "exercise" && (
            <p
              className={cn(
                "text-xs font-bold tracking-wider uppercase",
                difficultyTextColors[item.difficulty],
              )}
            >
              {t("common.exercise.difficulty")}:{" "}
              {t(`common.difficulty.${item.difficulty}`)}
            </p>
          )}
        </div>

        {isSelected ? (
          <ChevronDown className="text-muted-foreground size-4 shrink-0" />
        ) : (
          <ChevronRight className="text-muted-foreground size-4 shrink-0" />
        )}
      </button>

      {isSelected && (
        <div
          id={detailsId}
          data-testid={testIdPrefix ? `${testIdPrefix}-details` : undefined}
          className="border-border bg-muted/20 border-t px-4 py-4"
        >
          <div className="pl-14">
            <p
              data-testid={
                testIdPrefix ? `${testIdPrefix}-description` : undefined
              }
              className="text-muted-foreground text-sm leading-relaxed"
            >
              {itemDescription}
            </p>

            {onOpen && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={onOpen}
                  data-testid={
                    testIdPrefix ? `${testIdPrefix}-open` : undefined
                  }
                  className="bg-brand text-brand-foreground focus-visible:ring-ring inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
                >
                  {openLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

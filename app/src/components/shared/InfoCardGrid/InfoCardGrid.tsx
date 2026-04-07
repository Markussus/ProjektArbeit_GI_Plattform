import type { LucideIcon } from "lucide-react";

interface InfoCard {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface InfoCardGridProps {
  cards: InfoCard[];
}

export function InfoCardGrid({ cards }: InfoCardGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            className="bg-card ring-foreground/10 rounded-xl p-6 ring-1"
          >
            <Icon className="text-muted-foreground size-5" />
            <h2 className="text-foreground mt-4 text-lg font-semibold">
              {card.title}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}

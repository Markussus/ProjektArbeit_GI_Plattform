import type { ReactNode } from "react";

interface ResultSectionHeaderProps {
  icon: ReactNode;
  title: string;
}

export function ResultSectionHeader({ icon, title }: ResultSectionHeaderProps) {
  return (
    <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
      {icon}
      {title}
    </h3>
  );
}

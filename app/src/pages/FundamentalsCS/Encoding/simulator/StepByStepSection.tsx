import { StepByStepToggle } from "@/components/shared/SimulatorShared";

interface StepByStepSectionProps {
  open: boolean;
  onToggle: () => void;
  title: string;
  children: React.ReactNode;
}

export function StepByStepSection({
  open,
  onToggle,
  title,
  children,
}: StepByStepSectionProps) {
  return (
    <>
      <StepByStepToggle open={open} onToggle={onToggle} />
      {open && (
        <div className="space-y-2">
          <h4 className="text-foreground text-sm font-medium">{title}</h4>
          {children}
        </div>
      )}
    </>
  );
}

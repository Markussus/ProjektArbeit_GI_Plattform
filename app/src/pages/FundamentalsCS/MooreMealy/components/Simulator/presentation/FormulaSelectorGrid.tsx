import { cn } from "@/lib/utils";
import type { AutomataFormula } from "../domain/automataConversion";

interface FormulaSelectorGridProps {
  formulas: AutomataFormula[];
  selectedFormulaName: string;
  formulaMode: "minimal" | "canonical";
  onSelectFormula: (name: string) => void;
  testIdPrefix?: string;
}

export function FormulaSelectorGrid({
  formulas,
  selectedFormulaName,
  formulaMode,
  onSelectFormula,
  testIdPrefix = "moore-logic",
}: FormulaSelectorGridProps) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {formulas.map((candidate) => {
        const isSelected = selectedFormulaName === candidate.name;
        return (
          <button
            key={candidate.name}
            type="button"
            onClick={() => onSelectFormula(candidate.name)}
            data-testid={`${testIdPrefix}-formula-${candidate.name}`}
            className={cn(
              "border-border rounded-lg border p-3 text-left font-mono text-sm",
              isSelected ? "border-brand bg-brand/10" : "hover:bg-muted",
            )}
          >
            <strong>{candidate.name} = </strong>
            {formulaMode === "canonical"
              ? candidate.canonical
              : candidate.minimal}
          </button>
        );
      })}
    </div>
  );
}

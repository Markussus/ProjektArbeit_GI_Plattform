import type { MooreConversion } from "../domain/mooreConversion";
import { LogicGateDiagram } from "./LogicGateDiagram";

interface MooreCircuitDiagramProps {
  conversion: MooreConversion;
  unavailableText: string;
}

export function MooreCircuitDiagram({
  conversion,
  unavailableText,
}: MooreCircuitDiagramProps) {
  return (
    <div data-testid="moore-complete-circuit" className="space-y-6">
      <CircuitSection
        title="Überführungs-Schaltnetz δ"
        className="border-brand/40 bg-brand/5"
        formulas={conversion.transition.formulas}
        unavailableText={unavailableText}
      />

      <section className="border-border bg-card rounded-xl border-2 p-5 text-center">
        <div className="border-foreground mx-auto max-w-2xl rounded-lg border-2 p-5">
          <strong className="text-xl">D-Flipflop-Zustandsregister</strong>
          <p className="text-muted-foreground mt-2 text-sm">
            T0…Tn werden gespeichert und als S0…Sn an Überführungs- und
            Ausgabe-Schaltnetz zurückgeführt.
          </p>
        </div>
      </section>

      <CircuitSection
        title="Ausgabe-Schaltnetz λ"
        className="border-purple-500/40 bg-purple-500/5"
        formulas={conversion.output.formulas}
        unavailableText={unavailableText}
      />
    </div>
  );
}

function CircuitSection({
  title,
  className,
  formulas,
  unavailableText,
}: {
  title: string;
  className: string;
  formulas: MooreConversion["allFormulas"];
  unavailableText: string;
}) {
  return (
    <section className={`rounded-xl border-2 p-4 ${className}`}>
      <h4 className="mb-3 font-bold">{title}</h4>
      <div className="grid gap-4 xl:grid-cols-2">
        {formulas.map((formula) => (
          <div key={formula.name} className="space-y-2">
            <p className="font-mono font-semibold">
              {formula.name} = {formula.minimal}
            </p>
            <LogicGateDiagram
              expression={formula.expression}
              outputName={formula.name}
              variables={formula.variables}
              unavailableText={unavailableText}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

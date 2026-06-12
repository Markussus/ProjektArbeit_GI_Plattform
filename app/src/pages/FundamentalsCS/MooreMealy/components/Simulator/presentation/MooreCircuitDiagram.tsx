import type { BooleanExpression } from "@/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";
import type { MooreConversion, MooreFormula } from "../domain/mooreConversion";

interface MooreCircuitDiagramProps {
  conversion: MooreConversion;
  unavailableText: string;
}

const WIDTH = 1200;
const ROW_HEIGHT = 90;

export function MooreCircuitDiagram({
  conversion,
  unavailableText,
}: MooreCircuitDiagramProps) {
  const transitionFormulas = conversion.transition.formulas;
  const outputFormulas = conversion.output.formulas;
  if (
    [...transitionFormulas, ...outputFormulas].some(
      (formula) => !formula.expression,
    )
  ) {
    return (
      <div className="border-border rounded-xl border border-dashed p-10 text-center text-sm">
        {unavailableText}
      </div>
    );
  }

  const rowCount = Math.max(
    transitionFormulas.length,
    outputFormulas.length,
    1,
  );
  const height = 170 + rowCount * ROW_HEIGHT;
  const inputVariables = conversion.transition.inputVariables;

  return (
    <div
      data-testid="moore-complete-circuit"
      className="border-border bg-muted/10 overflow-auto rounded-xl border"
    >
      <svg
        role="img"
        aria-label="Combined Moore circuit"
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="min-w-[1050px]"
      >
        <defs>
          <marker
            id="complete-arrow"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 8 3 L 0 6 z" className="fill-foreground" />
          </marker>
        </defs>

        <SectionLabel x={235} text="Übergangslogik" />
        <SectionLabel x={600} text="Zustandsspeicher" />
        <SectionLabel x={925} text="Ausgabelogik" />

        {inputVariables.map((variable, index) => {
          const y = 105 + index * 34;
          return (
            <g key={variable}>
              <circle cx="50" cy={y} r="5" className="fill-foreground" />
              <text
                x="30"
                y={y + 5}
                textAnchor="end"
                className="fill-foreground font-mono font-bold"
              >
                {variable}
              </text>
              <path
                d={`M 55 ${y} H 150 V ${125 + index * 12} H 185`}
                fill="none"
                className="stroke-foreground"
                strokeWidth="2"
                markerEnd="url(#complete-arrow)"
              />
            </g>
          );
        })}

        {transitionFormulas.map((formula, index) => {
          const y = 145 + index * ROW_HEIGHT;
          return (
            <g key={formula.name}>
              <FormulaGateChain formula={formula} x={205} y={y} />
              <path
                d={`M 470 ${y} H 535`}
                className="stroke-foreground"
                strokeWidth="2"
                markerEnd="url(#complete-arrow)"
              />
              <RegisterBit x={590} y={y} index={index} />
              <path
                d={`M 645 ${y} H 790 V ${145 + index * 24} H 845`}
                fill="none"
                className="stroke-foreground"
                strokeWidth="2"
                markerEnd="url(#complete-arrow)"
              />
              <path
                d={`M 625 ${y + 30} V ${height - 35 - index * 10} H 175 V ${y + 28} H 205`}
                fill="none"
                className="stroke-muted-foreground"
                strokeDasharray="7 5"
                strokeWidth="2"
                markerEnd="url(#complete-arrow)"
              />
            </g>
          );
        })}

        {outputFormulas.map((formula, index) => {
          const y = 145 + index * ROW_HEIGHT;
          return (
            <g key={formula.name}>
              <FormulaGateChain formula={formula} x={855} y={y} compact />
              <path
                d={`M 1080 ${y} H 1140`}
                className="stroke-foreground"
                strokeWidth="2"
                markerEnd="url(#complete-arrow)"
              />
              <circle cx="1150" cy={y} r="5" className="fill-foreground" />
              <text
                x="1165"
                y={y + 5}
                className="fill-foreground font-mono font-bold"
              >
                {formula.name}
              </text>
            </g>
          );
        })}

        <text
          x="600"
          y={height - 8}
          textAnchor="middle"
          className="fill-muted-foreground text-xs"
        >
          Interne Zustandsrückkopplung
        </text>
      </svg>
    </div>
  );
}

function FormulaGateChain({
  formula,
  x,
  y,
  compact = false,
}: {
  formula: MooreFormula;
  x: number;
  y: number;
  compact?: boolean;
}) {
  const operators = collectOperators(formula.expression);
  const visibleOperators = operators.length
    ? operators.slice(0, compact ? 2 : 3)
    : ["constant"];
  const spacing = compact ? 82 : 88;

  return (
    <g data-testid={`moore-complete-formula-${formula.name}`}>
      {visibleOperators.map((operator, index) => {
        const gateX = x + index * spacing;
        return (
          <g key={`${operator}-${index}`}>
            {index > 0 && (
              <line
                x1={gateX - spacing + 42}
                y1={y}
                x2={gateX - 44}
                y2={y}
                className="stroke-foreground"
                strokeWidth="2"
                markerEnd="url(#complete-arrow)"
              />
            )}
            <IecGate x={gateX} y={y} operator={operator} />
          </g>
        );
      })}
      <text
        x={x}
        y={y + 43}
        className="fill-muted-foreground font-mono text-[10px]"
      >
        {formula.minimal}
      </text>
    </g>
  );
}

function IecGate({
  x,
  y,
  operator,
}: {
  x: number;
  y: number;
  operator: string;
}) {
  return (
    <g>
      <rect
        x={x - 38}
        y={y - 25}
        width="76"
        height="50"
        rx="4"
        className="fill-card stroke-foreground"
        strokeWidth="2"
      />
      <text
        x={x}
        y={y + 6}
        textAnchor="middle"
        className="fill-foreground text-lg font-bold"
      >
        {operator === "and"
          ? "&"
          : operator === "or"
            ? "≥1"
            : operator === "not"
              ? "1"
              : "="}
      </text>
      {operator === "not" && (
        <circle
          cx={x + 44}
          cy={y}
          r="6"
          className="fill-card stroke-foreground"
          strokeWidth="2"
        />
      )}
    </g>
  );
}

function RegisterBit({ x, y, index }: { x: number; y: number; index: number }) {
  return (
    <g>
      <rect
        x={x - 55}
        y={y - 31}
        width="110"
        height="62"
        rx="5"
        className="fill-card stroke-foreground"
        strokeWidth="2"
      />
      <text x={x - 44} y={y - 10} className="fill-muted-foreground text-xs">
        D
      </text>
      <text
        x={x}
        y={y + 6}
        textAnchor="middle"
        className="fill-foreground font-bold"
      >
        D-FF {index}
      </text>
      <text x={x + 42} y={y - 10} className="fill-muted-foreground text-xs">
        Q
      </text>
    </g>
  );
}

function SectionLabel({ x, text }: { x: number; text: string }) {
  return (
    <text
      x={x}
      y="42"
      textAnchor="middle"
      className="fill-foreground font-bold"
    >
      {text}
    </text>
  );
}

function collectOperators(expression: BooleanExpression | null): string[] {
  if (!expression) {
    return [];
  }
  if (expression.type === "not") {
    return [...collectOperators(expression.operand), "not"];
  }
  if (expression.type === "binary") {
    return [
      ...collectOperators(expression.left),
      ...collectOperators(expression.right),
      expression.operator,
    ];
  }
  return [];
}

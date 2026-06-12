import type { MooreConversion } from "../domain/mooreConversion";

interface MooreCircuitDiagramProps {
  conversion: MooreConversion;
}

export function MooreCircuitDiagram({ conversion }: MooreCircuitDiagramProps) {
  const inputs = conversion.transition.inputVariables;
  const states = conversion.transition.stateVariables;
  const targets = conversion.transition.targetVariables;
  const outputs = conversion.output.outputVariables;
  const height = Math.max(
    560,
    Math.max(inputs.length, outputs.length) * 70 + 160,
  );

  return (
    <div className="border-border bg-muted/10 overflow-auto rounded-xl border">
      <svg
        data-testid="moore-complete-circuit"
        role="img"
        aria-label="Complete Moore sequential circuit"
        viewBox={`0 0 1100 ${height}`}
        className="min-h-[28rem] w-full min-w-[900px]"
      >
        <defs>
          <marker
            id="circuit-arrow"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 8 3 L 0 6 z" className="fill-muted-foreground" />
          </marker>
        </defs>

        <Block
          x={250}
          y={80}
          width={260}
          height={180}
          title="δ"
          subtitle="Überführungs-Schaltnetz"
        />
        <Block
          x={600}
          y={80}
          width={190}
          height={180}
          title="D-FF"
          subtitle="Zustandsregister"
        />
        <Block
          x={600}
          y={320}
          width={190}
          height={150}
          title="λ"
          subtitle="Ausgabe-Schaltnetz"
        />

        {inputs.map((input, index) => {
          const y = 115 + index * 40;
          return (
            <Signal
              key={input}
              x1={55}
              y1={y}
              x2={250}
              y2={y}
              label={input}
              labelX={35}
            />
          );
        })}

        {targets.map((target, index) => {
          const y = 120 + index * 38;
          return (
            <Signal
              key={target}
              x1={510}
              y1={y}
              x2={600}
              y2={y}
              label={target}
              labelX={535}
            />
          );
        })}

        {states.map((state, index) => {
          const y = 120 + index * 38;
          const feedbackY = 285 + index * 10;
          return (
            <g key={state}>
              <path
                d={`M 790 ${y} H 850 V ${feedbackY} H 210 V ${y + 18} H 250`}
                fill="none"
                className="stroke-brand"
                strokeWidth="2"
                markerEnd="url(#circuit-arrow)"
              />
              <path
                d={`M 820 ${y} V ${350 + index * 28} H 790`}
                fill="none"
                className="stroke-muted-foreground"
                strokeWidth="2"
                markerEnd="url(#circuit-arrow)"
              />
              <text
                x={804}
                y={y - 6}
                className="fill-brand font-mono text-xs font-semibold"
              >
                {state}
              </text>
            </g>
          );
        })}

        {outputs.map((output, index) => {
          const y = 355 + index * 35;
          return (
            <Signal
              key={output}
              x1={790}
              y1={y}
              x2={1040}
              y2={y}
              label={output}
              labelX={1055}
            />
          );
        })}

        <text x="250" y={height - 25} className="fill-muted-foreground text-xs">
          Rückkopplung: aktueller Zustand S → δ; δ erzeugt Folgezustand T.
        </text>
      </svg>
    </div>
  );
}

function Block({
  x,
  y,
  width,
  height,
  title,
  subtitle,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  subtitle: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="10"
        className="fill-card stroke-foreground"
        strokeWidth="2"
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - 8}
        textAnchor="middle"
        className="fill-foreground text-3xl font-bold"
      >
        {title}
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 22}
        textAnchor="middle"
        className="fill-muted-foreground text-sm"
      >
        {subtitle}
      </text>
    </g>
  );
}

function Signal({
  x1,
  y1,
  x2,
  y2,
  label,
  labelX,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  labelX: number;
}) {
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className="stroke-muted-foreground"
        strokeWidth="2"
        markerEnd="url(#circuit-arrow)"
      />
      <circle cx={x1} cy={y1} r="5" className="fill-foreground" />
      <text
        x={labelX}
        y={y1 + 5}
        textAnchor={labelX < x1 ? "end" : "start"}
        className="fill-foreground font-mono text-sm font-semibold"
      >
        {label}
      </text>
    </g>
  );
}

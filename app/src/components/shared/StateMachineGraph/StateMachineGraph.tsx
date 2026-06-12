import { useMemo } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSvgZoomPan } from "@/hooks/useSvgZoomPan";

export interface StateMachineGraphNode {
  id: string;
  label: string;
  output?: string;
  isStart?: boolean;
  isActive?: boolean;
}

export interface StateMachineGraphEdge {
  from: string;
  to: string;
  label: string;
  isActive?: boolean;
}

export interface StateMachineGraphProps {
  nodes: StateMachineGraphNode[];
  edges: StateMachineGraphEdge[];
  ariaLabel: string;
  className?: string;
  testId?: string;
}

const NODE_RADIUS = 42;

export function StateMachineGraph({
  nodes,
  edges,
  ariaLabel,
  className,
  testId,
}: StateMachineGraphProps) {
  const layout = useMemo(() => createCircularLayout(nodes), [nodes]);
  const groupedEdges = useMemo(() => groupEdges(edges), [edges]);
  const {
    viewBox,
    scale,
    isPanning,
    setSvgRef,
    onMouseDown,
    zoomIn,
    zoomOut,
    reset,
  } = useSvgZoomPan(layout.width, layout.height);

  return (
    <div
      data-testid={testId}
      className={cn(
        "border-border bg-muted/20 relative min-h-80 overflow-hidden rounded-xl border",
        className,
      )}
    >
      <svg
        ref={setSvgRef}
        role="img"
        aria-label={ariaLabel}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        onMouseDown={onMouseDown}
        className={cn(
          "block min-h-96 w-full select-none",
          isPanning ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        <defs>
          <marker
            id="state-machine-arrow"
            markerWidth="10"
            markerHeight="8"
            refX="9"
            refY="4"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M 0 0 L 10 4 L 0 8 z" className="fill-muted-foreground" />
          </marker>
          <marker
            id="state-machine-arrow-active"
            markerWidth="10"
            markerHeight="8"
            refX="9"
            refY="4"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M 0 0 L 10 4 L 0 8 z" className="fill-brand" />
          </marker>
        </defs>

        {groupedEdges.map((edge) => {
          const from = layout.positions.get(edge.from);
          const to = layout.positions.get(edge.to);
          if (!from || !to) {
            return null;
          }

          return edge.from === edge.to ? (
            <SelfLoop
              key={`${edge.from}-${edge.to}`}
              x={from.x}
              y={from.y}
              label={edge.label}
              active={edge.isActive}
            />
          ) : (
            <DirectedEdge
              key={`${edge.from}-${edge.to}`}
              from={from}
              to={to}
              label={edge.label}
              active={edge.isActive}
            />
          );
        })}

        {nodes.map((node) => {
          const position = layout.positions.get(node.id);
          if (!position) {
            return null;
          }

          return (
            <g key={node.id}>
              {node.isStart && (
                <>
                  <line
                    x1={position.x - NODE_RADIUS - 48}
                    y1={position.y}
                    x2={position.x - NODE_RADIUS - 7}
                    y2={position.y}
                    className="stroke-muted-foreground"
                    strokeWidth="2"
                    markerEnd="url(#state-machine-arrow)"
                  />
                  <text
                    x={position.x - NODE_RADIUS - 52}
                    y={position.y - 7}
                    textAnchor="end"
                    className="fill-muted-foreground text-[11px]"
                  >
                    start
                  </text>
                </>
              )}
              <circle
                cx={position.x}
                cy={position.y}
                r={NODE_RADIUS}
                className={cn(
                  "fill-card stroke-border transition-colors",
                  node.isActive && "fill-brand/15 stroke-brand",
                )}
                strokeWidth={node.isActive ? 4 : 2}
              />
              <text
                x={position.x}
                y={position.y - (node.output ? 7 : 0)}
                textAnchor="middle"
                className={cn(
                  "fill-foreground text-[13px] font-semibold",
                  node.isActive && "fill-brand",
                )}
              >
                {node.label}
              </text>
              {node.output !== undefined && (
                <text
                  x={position.x}
                  y={position.y + 14}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[12px]"
                >
                  / {node.output}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute top-3 right-3 flex gap-1" data-no-pan>
        <GraphButton label="Zoom out" onClick={zoomOut}>
          <Minus className="size-4" />
        </GraphButton>
        <GraphButton label="Reset view" onClick={reset}>
          <RotateCcw className="size-4" />
        </GraphButton>
        <GraphButton label="Zoom in" onClick={zoomIn}>
          <Plus className="size-4" />
        </GraphButton>
      </div>
      <span className="bg-background/85 text-muted-foreground absolute right-3 bottom-3 rounded border px-2 py-1 text-xs">
        {Math.round(scale * 100)}%
      </span>
    </div>
  );
}

function GraphButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="border-border bg-background hover:bg-muted inline-flex size-8 items-center justify-center rounded-md border shadow-sm"
    >
      {children}
    </button>
  );
}

interface Point {
  x: number;
  y: number;
}

function createCircularLayout(nodes: StateMachineGraphNode[]) {
  const width = Math.max(520, nodes.length * 150);
  const height = Math.max(360, Math.min(620, nodes.length * 100));
  const centerX = width / 2;
  const centerY = height / 2;
  const radius =
    nodes.length <= 1 ? 0 : Math.min(width, height) / 2 - NODE_RADIUS - 54;
  const positions = new Map<string, Point>();

  nodes.forEach((node, index) => {
    const angle =
      nodes.length === 2
        ? index === 0
          ? Math.PI
          : 0
        : -Math.PI / 2 + (index * Math.PI * 2) / Math.max(nodes.length, 1);
    positions.set(node.id, {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  });

  return { width, height, positions };
}

function groupEdges(edges: StateMachineGraphEdge[]): StateMachineGraphEdge[] {
  const grouped = new Map<string, StateMachineGraphEdge>();

  for (const edge of edges) {
    const key = `${edge.from}\u0000${edge.to}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.label = `${existing.label}, ${edge.label}`;
      existing.isActive ||= edge.isActive;
    } else {
      grouped.set(key, { ...edge });
    }
  }

  return [...grouped.values()];
}

function DirectedEdge({
  from,
  to,
  label,
  active,
}: {
  from: Point;
  to: Point;
  label: string;
  active?: boolean;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const unitX = dx / distance;
  const unitY = dy / distance;
  const start = {
    x: from.x + unitX * NODE_RADIUS,
    y: from.y + unitY * NODE_RADIUS,
  };
  const end = {
    x: to.x - unitX * (NODE_RADIUS + 8),
    y: to.y - unitY * (NODE_RADIUS + 8),
  };
  const labelX = (start.x + end.x) / 2 - unitY * 12;
  const labelY = (start.y + end.y) / 2 + unitX * 12;

  return (
    <g>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        className={active ? "stroke-brand" : "stroke-muted-foreground"}
        strokeWidth={active ? 4 : 2}
        markerEnd={
          active
            ? "url(#state-machine-arrow-active)"
            : "url(#state-machine-arrow)"
        }
      />
      <EdgeLabel x={labelX} y={labelY} label={label} active={active} />
    </g>
  );
}

function SelfLoop({
  x,
  y,
  label,
  active,
}: {
  x: number;
  y: number;
  label: string;
  active?: boolean;
}) {
  const path = `M ${x - 22} ${y - 36} C ${x - 58} ${y - 92}, ${x + 58} ${y - 92}, ${x + 22} ${y - 36}`;

  return (
    <g>
      <path
        d={path}
        fill="none"
        className={active ? "stroke-brand" : "stroke-muted-foreground"}
        strokeWidth={active ? 4 : 2}
        markerEnd={
          active
            ? "url(#state-machine-arrow-active)"
            : "url(#state-machine-arrow)"
        }
      />
      <EdgeLabel x={x} y={y - 84} label={label} active={active} />
    </g>
  );
}

function EdgeLabel({
  x,
  y,
  label,
  active,
}: {
  x: number;
  y: number;
  label: string;
  active?: boolean;
}) {
  const width = Math.max(30, label.length * 7 + 14);

  return (
    <g>
      <rect
        x={x - width / 2}
        y={y - 12}
        width={width}
        height={24}
        rx={6}
        className={
          active ? "fill-brand/15 stroke-brand" : "fill-card stroke-border"
        }
      />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        className={cn(
          "fill-foreground text-[12px] font-semibold",
          active && "fill-brand",
        )}
      >
        {label}
      </text>
    </g>
  );
}

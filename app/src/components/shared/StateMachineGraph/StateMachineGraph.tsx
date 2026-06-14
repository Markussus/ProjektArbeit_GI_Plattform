import { useEffect, useMemo, useRef, useState } from "react";
import { List, Minus, Plus, RotateCcw, WrapText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSvgZoomPan } from "@/hooks/useSvgZoomPan";

export interface StateMachineGraphNode {
  id: string;
  label: string;
  output?: string;
  isStart?: boolean;
  isActive?: boolean;
  isPreview?: boolean;
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
  compact?: boolean;
}

const NODE_RADIUS = 42;

export function StateMachineGraph({
  nodes,
  edges,
  ariaLabel,
  className,
  testId,
  compact = false,
}: StateMachineGraphProps) {
  const layout = useMemo(() => createCircularLayout(nodes), [nodes]);
  const groupedEdges = useMemo(() => groupEdges(edges), [edges]);
  const [nodePositions, setNodePositions] = useState<Map<string, Point>>(
    () => new Map(),
  );
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [labelLayout, setLabelLayout] = useState<"wrapped" | "list">("wrapped");
  const svgElementRef = useRef<SVGSVGElement | null>(null);
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
  const positions = useMemo(
    () => new Map([...layout.positions, ...nodePositions]),
    [layout.positions, nodePositions],
  );

  useEffect(() => {
    if (!draggedNodeId) {
      return;
    }
    const handleMove = (event: MouseEvent) => {
      const svg = svgElementRef.current;
      if (!svg) {
        return;
      }
      const matrix = svg.getScreenCTM();
      if (!matrix) {
        return;
      }
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const transformed = point.matrixTransform(matrix.inverse());
      setNodePositions((current) => {
        const next = new Map(current);
        next.set(draggedNodeId, {
          x: transformed.x,
          y: transformed.y,
        });
        return next;
      });
    };
    const handleUp = () => setDraggedNodeId(null);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [draggedNodeId, layout.height, layout.width]);

  const resetGraph = () => {
    setNodePositions(new Map());
    reset();
  };

  return (
    <div
      data-testid={testId}
      className={cn(
        "border-border bg-muted/20 relative min-h-80 overflow-hidden rounded-xl border",
        compact && "h-96 max-h-[70vh] min-h-64 resize-y",
        className,
      )}
    >
      <svg
        ref={(element) => {
          svgElementRef.current = element;
          setSvgRef(element);
        }}
        role="img"
        aria-label={ariaLabel}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        onMouseDown={onMouseDown}
        className={cn(
          "block w-full select-none",
          compact ? "h-full min-h-0" : "min-h-96",
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
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
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
              labelLayout={labelLayout}
            />
          ) : (
            <DirectedEdge
              key={`${edge.from}-${edge.to}`}
              from={from}
              to={to}
              label={edge.label}
              active={edge.isActive}
              labelLayout={labelLayout}
              offset={
                groupedEdges.some(
                  (candidate) =>
                    candidate.from === edge.to && candidate.to === edge.from,
                )
                  ? edge.from.localeCompare(edge.to) < 0
                    ? 18
                    : -18
                  : 0
              }
            />
          );
        })}

        {nodes.map((node) => {
          const position = positions.get(node.id);
          if (!position) {
            return null;
          }

          return (
            <g
              key={node.id}
              data-testid={`state-machine-node-${node.id}`}
              onMouseDown={(event) => {
                if (event.button !== 0) {
                  return;
                }
                event.preventDefault();
                event.stopPropagation();
                setDraggedNodeId(node.id);
              }}
              className={
                draggedNodeId === node.id ? "cursor-grabbing" : "cursor-grab"
              }
            >
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
                  node.isPreview && "fill-brand/5 stroke-brand",
                )}
                strokeWidth={node.isActive || node.isPreview ? 4 : 2}
                strokeDasharray={node.isPreview ? "8 6" : undefined}
              />
              <text
                x={position.x}
                y={position.y - (node.output ? 13 : 0)}
                textAnchor="middle"
                className={cn(
                  "fill-foreground text-[13px] font-semibold",
                  node.isActive && "fill-brand",
                  node.isPreview && "fill-brand",
                )}
              >
                {node.label}
              </text>
              {node.output !== undefined && (
                <>
                  <line
                    x1={position.x - NODE_RADIUS + 5}
                    y1={position.y}
                    x2={position.x + NODE_RADIUS - 5}
                    y2={position.y}
                    className={cn(
                      "stroke-border",
                      (node.isActive || node.isPreview) && "stroke-brand",
                    )}
                    strokeWidth="1.5"
                  />
                  <text
                    x={position.x}
                    y={position.y + 21}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[12px]"
                  >
                    {node.output}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute top-3 right-3 flex gap-1" data-no-pan>
        <GraphButton
          label={
            labelLayout === "wrapped"
              ? "Show transition symbols as a vertical list"
              : "Show transition symbols comma-separated"
          }
          onClick={() =>
            setLabelLayout((current) =>
              current === "wrapped" ? "list" : "wrapped",
            )
          }
        >
          {labelLayout === "wrapped" ? (
            <List className="size-4" />
          ) : (
            <WrapText className="size-4" />
          )}
        </GraphButton>
        <GraphButton label="Zoom out" onClick={zoomOut}>
          <Minus className="size-4" />
        </GraphButton>
        <GraphButton label="Reset view" onClick={resetGraph}>
          <RotateCcw className="size-4" />
        </GraphButton>
        <GraphButton label="Zoom in" onClick={zoomIn}>
          <Plus className="size-4" />
        </GraphButton>
      </div>
      <button
        type="button"
        onClick={resetGraph}
        aria-label="Reset zoom to 100%"
        className="bg-background/85 text-muted-foreground hover:text-foreground absolute right-3 bottom-3 rounded border px-2 py-1 text-xs"
      >
        {Math.round(scale * 100)}%
      </button>
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
  offset = 0,
  labelLayout,
}: {
  from: Point;
  to: Point;
  label: string;
  active?: boolean;
  offset?: number;
  labelLayout: "wrapped" | "list";
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const unitX = dx / distance;
  const unitY = dy / distance;
  const start = {
    x: from.x + unitX * NODE_RADIUS - unitY * offset,
    y: from.y + unitY * NODE_RADIUS + unitX * offset,
  };
  const end = {
    x: to.x - unitX * (NODE_RADIUS + 8) - unitY * offset,
    y: to.y - unitY * (NODE_RADIUS + 8) + unitX * offset,
  };
  const labelX = (start.x + end.x) / 2 - unitY * 14;
  const labelY = (start.y + end.y) / 2 + unitX * 14;

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
      <EdgeLabel
        x={labelX}
        y={labelY}
        label={label}
        active={active}
        layout={labelLayout}
      />
    </g>
  );
}

function SelfLoop({
  x,
  y,
  label,
  active,
  labelLayout,
}: {
  x: number;
  y: number;
  label: string;
  active?: boolean;
  labelLayout: "wrapped" | "list";
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
      <EdgeLabel
        x={x}
        y={y - 84}
        label={label}
        active={active}
        layout={labelLayout}
      />
    </g>
  );
}

function EdgeLabel({
  x,
  y,
  label,
  active,
  layout,
}: {
  x: number;
  y: number;
  label: string;
  active?: boolean;
  layout: "wrapped" | "list";
}) {
  const labels = label.split(", ");
  const lines =
    layout === "list" ? labels : wrapCommaSeparatedLabels(labels, 24);
  const width = Math.max(30, ...lines.map((line) => line.length * 7 + 14));
  const height = Math.max(24, lines.length * 18 + 8);

  return (
    <g>
      <rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={6}
        className={
          active ? "fill-brand/15 stroke-brand" : "fill-card stroke-border"
        }
      />
      {lines.map((line, index) => (
        <text
          key={`${line}-${index}`}
          x={x}
          y={y - ((lines.length - 1) * 18) / 2 + index * 18 + 4}
          textAnchor="middle"
          className={cn(
            "fill-foreground text-[12px] font-semibold",
            active && "fill-brand",
          )}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function wrapCommaSeparatedLabels(labels: string[], maxCharacters: number) {
  return labels.reduce<string[]>((lines, label) => {
    const lastIndex = lines.length - 1;
    const candidate = lastIndex >= 0 ? `${lines[lastIndex]}, ${label}` : label;
    if (lastIndex >= 0 && candidate.length <= maxCharacters) {
      lines[lastIndex] = candidate;
    } else {
      lines.push(label);
    }
    return lines;
  }, []);
}

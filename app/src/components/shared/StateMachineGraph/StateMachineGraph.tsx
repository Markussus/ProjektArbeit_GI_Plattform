import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { List, Minus, Plus, RotateCcw, WrapText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useSvgZoomPan } from "@/hooks/useSvgZoomPan";
import { Tooltip } from "@/components/shared/Tooltip";

export interface StateMachineGraphNode {
  id: string;
  label: string;
  output?: string;
  isStart?: boolean;
  isAccept?: boolean;
  isActive?: boolean;
  isPreview?: boolean;
  isViolation?: boolean;
}

export interface StateMachineGraphEdge {
  from: string;
  to: string;
  label: string;
  isActive?: boolean;
  isViolation?: boolean;
}

export interface StateMachineGraphProps {
  nodes: StateMachineGraphNode[];
  edges: StateMachineGraphEdge[];
  ariaLabel: string;
  className?: string;
  testId?: string;
  compact?: boolean;
  defaultLabelLayout?: "wrapped" | "list";
  nodeRadius?: number;
}

export function StateMachineGraph({
  nodes,
  edges,
  ariaLabel,
  className,
  testId,
  compact = false,
  defaultLabelLayout = "wrapped",
  nodeRadius: customNodeRadius,
}: StateMachineGraphProps) {
  const { t } = useTranslation();
  const markerPrefix = useId().replaceAll(":", "");
  const arrowMarkerId = `${markerPrefix}-state-machine-arrow`;
  const activeArrowMarkerId = `${markerPrefix}-state-machine-arrow-active`;
  const violationArrowMarkerId = `${markerPrefix}-state-machine-arrow-violation`;

  const hasOutputs = useMemo(
    () => nodes.some((node) => node.output !== undefined),
    [nodes],
  );
  const nodeRadius = customNodeRadius ?? (hasOutputs ? 36 : 30);

  const layout = useMemo(
    () => createCircularLayout(nodes, nodeRadius),
    [nodes, nodeRadius],
  );
  const groupedEdges = useMemo(() => groupEdges(edges), [edges]);
  const [nodePositions, setNodePositions] = useState<Map<string, Point>>(
    () => new Map(),
  );
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [labelLayout, setLabelLayout] = useState<"wrapped" | "list">(
    defaultLabelLayout,
  );
  const svgElementRef = useRef<SVGSVGElement | null>(null);
  const previousActiveNodeIdRef = useRef<string | undefined>(undefined);
  const {
    viewBox,
    scale,
    isPanning,
    setSvgRef,
    onMouseDown,
    zoomIn,
    zoomOut,
    ensurePointVisible,
    reset,
  } = useSvgZoomPan(layout.width, layout.height);
  const positions = useMemo(
    () => new Map([...layout.positions, ...nodePositions]),
    [layout.positions, nodePositions],
  );
  const activeNodeId = nodes.find((node) => node.isActive)?.id;
  const activePosition = activeNodeId ? positions.get(activeNodeId) : undefined;

  useLayoutEffect(() => {
    const activeNodeChanged = previousActiveNodeIdRef.current !== activeNodeId;
    previousActiveNodeIdRef.current = activeNodeId;
    if (activePosition && activeNodeChanged) {
      ensurePointVisible(activePosition.x, activePosition.y, nodeRadius);
    }
  }, [activeNodeId, activePosition, ensurePointVisible, nodeRadius]);

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
  }, [draggedNodeId]);

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
            id={arrowMarkerId}
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
            id={activeArrowMarkerId}
            markerWidth="10"
            markerHeight="8"
            refX="9"
            refY="4"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M 0 0 L 10 4 L 0 8 z" className="fill-brand" />
          </marker>
          <marker
            id={violationArrowMarkerId}
            markerWidth="10"
            markerHeight="8"
            refX="9"
            refY="4"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M 0 0 L 10 4 L 0 8 z" className="fill-destructive" />
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
              isViolation={edge.isViolation}
              labelLayout={labelLayout}
              arrowMarkerId={arrowMarkerId}
              activeArrowMarkerId={activeArrowMarkerId}
              violationArrowMarkerId={violationArrowMarkerId}
              nodeRadius={nodeRadius}
            />
          ) : (
            <DirectedEdge
              key={`${edge.from}-${edge.to}`}
              from={from}
              to={to}
              label={edge.label}
              active={edge.isActive}
              isViolation={edge.isViolation}
              labelLayout={labelLayout}
              arrowMarkerId={arrowMarkerId}
              activeArrowMarkerId={activeArrowMarkerId}
              violationArrowMarkerId={violationArrowMarkerId}
              nodeRadius={nodeRadius}
              isBidirectional={groupedEdges.some(
                (candidate) =>
                  candidate.from === edge.to && candidate.to === edge.from,
              )}
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
                    x1={position.x - nodeRadius - 40}
                    y1={position.y}
                    x2={position.x - nodeRadius - 5}
                    y2={position.y}
                    className="stroke-muted-foreground"
                    strokeWidth="2"
                    markerEnd={`url(#${arrowMarkerId})`}
                  />
                  <text
                    x={position.x - nodeRadius - 44}
                    y={position.y - 5}
                    textAnchor="end"
                    className="fill-muted-foreground text-[11px] font-medium"
                  >
                    {t("moore-mealy.graph.start", "Start")}
                  </text>
                </>
              )}
              {node.isAccept && (
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={nodeRadius + 6}
                  className={cn(
                    "stroke-border fill-none transition-colors",
                    node.isActive && "stroke-brand",
                    node.isViolation && "stroke-destructive",
                  )}
                  strokeWidth={node.isActive ? 2.5 : 1.5}
                />
              )}
              <circle
                cx={position.x}
                cy={position.y}
                r={nodeRadius}
                className={cn(
                  "fill-card stroke-border transition-colors",
                  node.isActive && "fill-brand/15 stroke-brand",
                  node.isPreview && "fill-brand/5 stroke-brand",
                  node.isViolation && "fill-destructive/15 stroke-destructive",
                )}
                strokeWidth={
                  node.isActive || node.isPreview || node.isViolation ? 3.5 : 2
                }
                strokeDasharray={node.isPreview ? "8 6" : undefined}
              />
              <text
                x={position.x}
                y={position.y - (node.output ? 9 : -4)}
                textAnchor="middle"
                className={cn(
                  "fill-foreground text-[13px] font-semibold select-none",
                  node.isActive && "fill-brand",
                  node.isPreview && "fill-brand",
                  node.isViolation && "fill-destructive",
                )}
              >
                {node.label}
              </text>
              {node.isViolation && (
                <g>
                  <circle
                    cx={position.x + nodeRadius * 0.7}
                    cy={position.y - nodeRadius * 0.7}
                    r={7.5}
                    className="fill-destructive"
                  />
                  <text
                    x={position.x + nodeRadius * 0.7}
                    y={position.y - nodeRadius * 0.7 + 3.5}
                    textAnchor="middle"
                    className="fill-destructive-foreground text-[10px] font-extrabold"
                  >
                    !
                  </text>
                </g>
              )}
              {node.output !== undefined && (
                <>
                  <line
                    x1={position.x - nodeRadius + 4}
                    y1={position.y}
                    x2={position.x + nodeRadius - 4}
                    y2={position.y}
                    className={cn(
                      "stroke-border",
                      (node.isActive || node.isPreview) && "stroke-brand",
                    )}
                    strokeWidth="1.5"
                  />
                  <text
                    x={position.x}
                    y={position.y + 19}
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
              ? t("moore-mealy.graph.showAsList")
              : t("moore-mealy.graph.showWrapped")
          }
          testId={testId ? `${testId}-label-layout-toggle` : undefined}
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
        <GraphButton
          label={t("moore-mealy.graph.zoomOut")}
          testId={testId ? `${testId}-zoom-out` : undefined}
          onClick={zoomOut}
        >
          <Minus className="size-4" />
        </GraphButton>
        <GraphButton
          label={t("moore-mealy.graph.resetView")}
          testId={testId ? `${testId}-reset-view` : undefined}
          onClick={resetGraph}
        >
          <RotateCcw className="size-4" />
        </GraphButton>
        <GraphButton
          label={t("moore-mealy.graph.zoomIn")}
          testId={testId ? `${testId}-zoom-in` : undefined}
          onClick={zoomIn}
        >
          <Plus className="size-4" />
        </GraphButton>
      </div>
      <button
        type="button"
        onClick={resetGraph}
        aria-label={t("moore-mealy.graph.resetZoom")}
        data-testid={testId ? `${testId}-zoom-percent-reset` : undefined}
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
  testId,
  children,
}: {
  label: string;
  onClick: () => void;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip label={label} side="bottom">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        data-testid={testId}
        className="border-border bg-background hover:bg-muted inline-flex size-8 items-center justify-center rounded-md border shadow-sm"
      >
        {children}
      </button>
    </Tooltip>
  );
}

interface Point {
  x: number;
  y: number;
}

function createCircularLayout(
  nodes: StateMachineGraphNode[],
  nodeRadius: number,
) {
  const n = nodes.length;
  const radius =
    n <= 1
      ? 0
      : n === 2
        ? 120
        : Math.max(120, (n * (nodeRadius * 2 + 55)) / (2 * Math.PI));

  const rawPositions = new Map<string, Point>();
  nodes.forEach((node, index) => {
    let angle: number;
    if (n === 2) {
      angle = index === 0 ? Math.PI : 0;
    } else {
      angle = -Math.PI / 2 + (index * Math.PI * 2) / Math.max(n, 1);
    }
    rawPositions.set(node.id, {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  });

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of rawPositions.values()) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const paddingLeft = nodeRadius + 60;
  const paddingRight = nodeRadius + 50;
  const paddingTop = nodeRadius + 75;
  const paddingBottom = nodeRadius + 50;

  const contentWidth = maxX - minX + paddingLeft + paddingRight;
  const contentHeight = maxY - minY + paddingTop + paddingBottom;

  const width = Math.max(n <= 1 ? 300 : n <= 2 ? 380 : 440, contentWidth);
  const height = Math.max(n <= 1 ? 240 : n <= 2 ? 280 : 360, contentHeight);

  const offsetX = paddingLeft - minX + (width - contentWidth) / 2;
  const offsetY = paddingTop - minY + (height - contentHeight) / 2;

  const positions = new Map<string, Point>();
  for (const [id, p] of rawPositions.entries()) {
    positions.set(id, {
      x: p.x + offsetX,
      y: p.y + offsetY,
    });
  }

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
      existing.isViolation ||= edge.isViolation;
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
  isViolation,
  isBidirectional = false,
  labelLayout,
  arrowMarkerId,
  activeArrowMarkerId,
  violationArrowMarkerId,
  nodeRadius,
}: {
  from: Point;
  to: Point;
  label: string;
  active?: boolean;
  isViolation?: boolean;
  isBidirectional?: boolean;
  labelLayout: "wrapped" | "list";
  arrowMarkerId: string;
  activeArrowMarkerId: string;
  violationArrowMarkerId: string;
  nodeRadius: number;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const unitX = dx / distance;
  const unitY = dy / distance;
  const normX = -unitY;
  const normY = unitX;

  const edgeColorClass = active
    ? "stroke-brand"
    : isViolation
      ? "stroke-destructive"
      : "stroke-muted-foreground";
  const markerId = active
    ? activeArrowMarkerId
    : isViolation
      ? violationArrowMarkerId
      : arrowMarkerId;

  if (isBidirectional) {
    const lateralShift = 6;
    const curveAmount = 24;
    const start = {
      x: from.x + unitX * nodeRadius + normX * lateralShift,
      y: from.y + unitY * nodeRadius + normY * lateralShift,
    };
    const end = {
      x: to.x - unitX * (nodeRadius + 6) + normX * lateralShift,
      y: to.y - unitY * (nodeRadius + 6) + normY * lateralShift,
    };
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const controlX = midX + normX * curveAmount;
    const controlY = midY + normY * curveAmount;

    const labelX = midX + normX * (curveAmount + 14);
    const labelY = midY + normY * (curveAmount + 14);

    const pathData = `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;

    return (
      <g>
        <path
          d={pathData}
          fill="none"
          className={edgeColorClass}
          strokeWidth={active ? 3.5 : isViolation ? 2.5 : 1.75}
          markerEnd={`url(#${markerId})`}
        />
        <EdgeLabel
          x={labelX}
          y={labelY}
          label={label}
          active={active}
          isViolation={isViolation}
          layout={labelLayout}
        />
      </g>
    );
  }

  const start = {
    x: from.x + unitX * nodeRadius,
    y: from.y + unitY * nodeRadius,
  };
  const end = {
    x: to.x - unitX * (nodeRadius + 6),
    y: to.y - unitY * (nodeRadius + 6),
  };
  const labelX = (start.x + end.x) / 2 + normX * 14;
  const labelY = (start.y + end.y) / 2 + normY * 14;

  return (
    <g>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        className={edgeColorClass}
        strokeWidth={active ? 3.5 : isViolation ? 2.5 : 1.75}
        markerEnd={`url(#${markerId})`}
      />
      <EdgeLabel
        x={labelX}
        y={labelY}
        label={label}
        active={active}
        isViolation={isViolation}
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
  isViolation,
  labelLayout,
  arrowMarkerId,
  activeArrowMarkerId,
  violationArrowMarkerId,
  nodeRadius,
}: {
  x: number;
  y: number;
  label: string;
  active?: boolean;
  isViolation?: boolean;
  labelLayout: "wrapped" | "list";
  arrowMarkerId: string;
  activeArrowMarkerId: string;
  violationArrowMarkerId: string;
  nodeRadius: number;
}) {
  const startX = x - nodeRadius * 0.45;
  const startY = y - nodeRadius * 0.9;
  const endX = x + nodeRadius * 0.45;
  const endY = y - nodeRadius * 0.9;
  const ctrl1X = x - nodeRadius * 1.35;
  const ctrl1Y = y - nodeRadius * 2.5;
  const ctrl2X = x + nodeRadius * 1.35;
  const ctrl2Y = y - nodeRadius * 2.5;

  const path = `M ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`;
  const labelY = y - nodeRadius * 2.0;

  const edgeColorClass = active
    ? "stroke-brand"
    : isViolation
      ? "stroke-destructive"
      : "stroke-muted-foreground";
  const markerId = active
    ? activeArrowMarkerId
    : isViolation
      ? violationArrowMarkerId
      : arrowMarkerId;

  return (
    <g>
      <path
        d={path}
        fill="none"
        className={edgeColorClass}
        strokeWidth={active ? 3.5 : isViolation ? 2.5 : 1.75}
        markerEnd={`url(#${markerId})`}
      />
      <EdgeLabel
        x={x}
        y={labelY}
        label={label}
        active={active}
        isViolation={isViolation}
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
  isViolation,
  layout,
}: {
  x: number;
  y: number;
  label: string;
  active?: boolean;
  isViolation?: boolean;
  layout: "wrapped" | "list";
}) {
  const labels = label.split(", ");
  const lines =
    layout === "list" ? labels : wrapCommaSeparatedLabels(labels, 24);
  const width = Math.max(28, ...lines.map((line) => line.length * 7 + 12));
  const height = Math.max(22, lines.length * 16 + 6);

  const rectBgClass = active
    ? "fill-brand/15 stroke-brand"
    : isViolation
      ? "fill-destructive/15 stroke-destructive"
      : "fill-card stroke-border";

  return (
    <g>
      <rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={5}
        className={rectBgClass}
      />
      {lines.map((line, index) => (
        <text
          key={`${line}-${index}`}
          x={x}
          y={y - ((lines.length - 1) * 16) / 2 + index * 16 + 4}
          textAnchor="middle"
          className={cn(
            "fill-foreground text-[11.5px] font-semibold select-none",
            active && "fill-brand",
            isViolation && "fill-destructive",
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

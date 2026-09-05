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
import {
  createCircularLayout,
  createDirectedEdgeGeometry,
  createSelfLoopGeometry,
  type Point,
} from "./stateMachineGraphGeometry";

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
          return position ? (
            <StateNode
              key={node.id}
              node={node}
              position={position}
              nodeRadius={nodeRadius}
              arrowMarkerId={arrowMarkerId}
              startLabel={t("moore-mealy.graph.start", "Start")}
              isDragged={draggedNodeId === node.id}
              onDragStart={setDraggedNodeId}
            />
          ) : null;
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

function getNodeStatusStyle(node: StateMachineGraphNode) {
  if (node.isViolation) {
    return {
      circle: "fill-destructive/15 stroke-destructive",
      text: "fill-destructive",
      strokeWidth: 3.5,
    };
  }
  if (node.isActive) {
    return {
      circle: "fill-brand/15 stroke-brand",
      text: "fill-brand",
      strokeWidth: 3.5,
    };
  }
  if (node.isPreview) {
    return {
      circle: "fill-brand/5 stroke-brand",
      text: "fill-brand",
      strokeWidth: 3.5,
    };
  }
  return {
    circle: "",
    text: "",
    strokeWidth: 2,
  };
}

function getStateNodeVisuals(node: StateMachineGraphNode) {
  const style = getNodeStatusStyle(node);
  return {
    circleClass: cn("fill-card stroke-border transition-colors", style.circle),
    textClass: cn(
      "fill-foreground text-[13px] font-semibold select-none",
      style.text,
    ),
    strokeWidth: style.strokeWidth,
    dashArray: node.isPreview ? "8 6" : undefined,
    textYOffset: node.output ? 9 : -4,
  };
}

function StateNode({
  node,
  position,
  nodeRadius,
  arrowMarkerId,
  startLabel,
  isDragged,
  onDragStart,
}: {
  node: StateMachineGraphNode;
  position: Point;
  nodeRadius: number;
  arrowMarkerId: string;
  startLabel: string;
  isDragged: boolean;
  onDragStart: (nodeId: string) => void;
}) {
  const handleMouseDown = (event: React.MouseEvent<SVGGElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    onDragStart(node.id);
  };

  const visuals = getStateNodeVisuals(node);

  return (
    <g
      data-testid={`state-machine-node-${node.id}`}
      onMouseDown={handleMouseDown}
      className={isDragged ? "cursor-grabbing" : "cursor-grab"}
    >
      <StateStartIndicator
        visible={Boolean(node.isStart)}
        position={position}
        nodeRadius={nodeRadius}
        arrowMarkerId={arrowMarkerId}
        label={startLabel}
      />
      <StateAcceptRing
        visible={Boolean(node.isAccept)}
        position={position}
        nodeRadius={nodeRadius}
        active={Boolean(node.isActive)}
        violation={Boolean(node.isViolation)}
      />
      <circle
        cx={position.x}
        cy={position.y}
        r={nodeRadius}
        className={visuals.circleClass}
        strokeWidth={visuals.strokeWidth}
        strokeDasharray={visuals.dashArray}
      />
      <text
        x={position.x}
        y={position.y - visuals.textYOffset}
        textAnchor="middle"
        className={visuals.textClass}
      >
        {node.label}
      </text>
      <StateViolationIndicator
        visible={Boolean(node.isViolation)}
        position={position}
        nodeRadius={nodeRadius}
      />
      <StateOutput
        output={node.output}
        position={position}
        nodeRadius={nodeRadius}
        highlighted={Boolean(node.isActive || node.isPreview)}
      />
    </g>
  );
}

function StateStartIndicator({
  visible,
  position,
  nodeRadius,
  arrowMarkerId,
  label,
}: {
  visible: boolean;
  position: Point;
  nodeRadius: number;
  arrowMarkerId: string;
  label: string;
}) {
  if (!visible) return null;
  return (
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
        {label}
      </text>
    </>
  );
}

function StateAcceptRing({
  visible,
  position,
  nodeRadius,
  active,
  violation,
}: {
  visible: boolean;
  position: Point;
  nodeRadius: number;
  active: boolean;
  violation: boolean;
}) {
  if (!visible) return null;
  return (
    <circle
      cx={position.x}
      cy={position.y}
      r={nodeRadius + 6}
      className={cn(
        "stroke-border fill-none transition-colors",
        active && "stroke-brand",
        violation && "stroke-destructive",
      )}
      strokeWidth={active ? 2.5 : 1.5}
    />
  );
}

function StateViolationIndicator({
  visible,
  position,
  nodeRadius,
}: {
  visible: boolean;
  position: Point;
  nodeRadius: number;
}) {
  if (!visible) return null;
  const x = position.x + nodeRadius * 0.7;
  const y = position.y - nodeRadius * 0.7;
  return (
    <g>
      <circle cx={x} cy={y} r={7.5} className="fill-destructive" />
      <text
        x={x}
        y={y + 3.5}
        textAnchor="middle"
        className="fill-destructive-foreground text-[10px] font-extrabold"
      >
        !
      </text>
    </g>
  );
}

function StateOutput({
  output,
  position,
  nodeRadius,
  highlighted,
}: {
  output?: string;
  position: Point;
  nodeRadius: number;
  highlighted: boolean;
}) {
  if (output === undefined) return null;
  return (
    <>
      <line
        x1={position.x - nodeRadius + 4}
        y1={position.y}
        x2={position.x + nodeRadius - 4}
        y2={position.y}
        className={cn("stroke-border", highlighted && "stroke-brand")}
        strokeWidth="1.5"
      />
      <text
        x={position.x}
        y={position.y + 19}
        textAnchor="middle"
        className="fill-muted-foreground text-[12px]"
      >
        {output}
      </text>
    </>
  );
}

function groupEdges(edges: StateMachineGraphEdge[]): StateMachineGraphEdge[] {
  const grouped = new Map<string, StateMachineGraphEdge>();

  for (const edge of edges) {
    const key = `${edge.from}\0${edge.to}`;
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

function getEdgeVisualProps({
  active,
  isViolation,
  arrowMarkerId,
  activeArrowMarkerId,
  violationArrowMarkerId,
}: {
  active?: boolean;
  isViolation?: boolean;
  arrowMarkerId: string;
  activeArrowMarkerId: string;
  violationArrowMarkerId: string;
}) {
  if (active) {
    return {
      edgeColorClass: "stroke-brand",
      markerId: activeArrowMarkerId,
      strokeWidth: 3.5,
    };
  }
  if (isViolation) {
    return {
      edgeColorClass: "stroke-destructive",
      markerId: violationArrowMarkerId,
      strokeWidth: 2.5,
    };
  }
  return {
    edgeColorClass: "stroke-muted-foreground",
    markerId: arrowMarkerId,
    strokeWidth: 1.75,
  };
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
  const { edgeColorClass, markerId, strokeWidth } = getEdgeVisualProps({
    active,
    isViolation,
    arrowMarkerId,
    activeArrowMarkerId,
    violationArrowMarkerId,
  });
  const geometry = createDirectedEdgeGeometry(
    from,
    to,
    nodeRadius,
    isBidirectional,
  );

  return (
    <g>
      {geometry.control ? (
        <path
          d={`M ${geometry.start.x} ${geometry.start.y} Q ${geometry.control.x} ${geometry.control.y} ${geometry.end.x} ${geometry.end.y}`}
          fill="none"
          className={edgeColorClass}
          strokeWidth={strokeWidth}
          markerEnd={`url(#${markerId})`}
        />
      ) : (
        <line
          x1={geometry.start.x}
          y1={geometry.start.y}
          x2={geometry.end.x}
          y2={geometry.end.y}
          className={edgeColorClass}
          strokeWidth={strokeWidth}
          markerEnd={`url(#${markerId})`}
        />
      )}
      <EdgeLabel
        x={geometry.label.x}
        y={geometry.label.y}
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
  const geometry = createSelfLoopGeometry({ x, y }, nodeRadius);
  const { edgeColorClass, markerId, strokeWidth } = getEdgeVisualProps({
    active,
    isViolation,
    arrowMarkerId,
    activeArrowMarkerId,
    violationArrowMarkerId,
  });

  return (
    <g>
      <path
        d={geometry.path}
        fill="none"
        className={edgeColorClass}
        strokeWidth={strokeWidth}
        markerEnd={`url(#${markerId})`}
      />
      <EdgeLabel
        x={geometry.label.x}
        y={geometry.label.y}
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

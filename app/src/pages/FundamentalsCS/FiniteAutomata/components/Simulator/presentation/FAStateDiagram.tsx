import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { FAProgram } from "../domain/faTypes";
import type { FARuntime } from "../domain/faRuntime";
import {
  findDFAViolations,
  buildViolationEdgeKeys,
  type DFAViolation,
} from "../domain/faDeterminismCheck";
import {
  computeLayout,
  type GraphLayout,
  type NodeLayout,
} from "../domain/faLayoutEngine";
import { useGraphZoomPan } from "./useGraphZoomPan";

interface FAStateDiagramProps {
  program: FAProgram;
  runtime: FARuntime;
}

interface Point {
  x: number;
  y: number;
}

const NODE_RADIUS = 28;
const ACCEPT_RING_GAP = 5;

/** Edge labels disappear below this display scale to keep things readable. */
const EDGE_LABEL_MIN_SCALE = 0.55;
/** Node labels disappear below this display scale (rare — overview only). */
const NODE_LABEL_MIN_SCALE = 0.32;

/**
 * SVG state diagram with neon theme, glow effects, DFA violation highlights,
 * adaptive layout (circular for small, force-directed for larger automata),
 * and zoom/pan controls.
 */
export function FAStateDiagram({ program, runtime }: FAStateDiagramProps) {
  const layout = useMemo<GraphLayout>(
    () => computeLayout(program, { nodeRadius: NODE_RADIUS }),
    [program],
  );

  // User-dragged node positions override the computed layout. Cleared by reset.
  const [nodePositions, setNodePositions] = useState<Map<string, Point>>(
    () => new Map(),
  );
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const svgElementRef = useRef<SVGSVGElement | null>(null);

  const resolvePos = (id: string): NodeLayout | undefined => {
    const base = layout.nodeMap.get(id);
    if (!base) return undefined;
    const override = nodePositions.get(id);
    return override ? { ...base, x: override.x, y: override.y } : base;
  };

  const violations = useMemo(() => findDFAViolations(program), [program]);
  const violationEdgeKeys = useMemo(
    () => buildViolationEdgeKeys(violations),
    [violations],
  );
  const violatingStates = useMemo(
    () => new Set(violations.map((v) => v.state)),
    [violations],
  );

  const activeSet = new Set(runtime.activeStates);
  const acceptSet = new Set(program.acceptStates);

  const lastTransition =
    runtime.transitionHistory.length > 0
      ? runtime.transitionHistory[runtime.transitionHistory.length - 1]
      : null;

  const {
    viewBox,
    scale,
    setSvgRef,
    onMouseDown,
    isPanning,
    zoomIn,
    zoomOut,
    reset,
  } = useGraphZoomPan(layout.width, layout.height);

  // Drag a node by tracking the pointer at window level (so it keeps working
  // even if the cursor leaves the SVG mid-drag), mapping client coordinates
  // into the SVG's user space so it stays accurate at any zoom level.
  useEffect(() => {
    if (!draggedNodeId) {
      return;
    }
    const handleMove = (event: MouseEvent) => {
      const svg = svgElementRef.current;
      const matrix = svg?.getScreenCTM();
      if (!svg || !matrix) {
        return;
      }
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const transformed = point.matrixTransform(matrix.inverse());
      setNodePositions((current) => {
        const next = new Map(current);
        next.set(draggedNodeId, { x: transformed.x, y: transformed.y });
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

  // Reset is meaningful while the view is zoomed/panned or a node was dragged.
  const isViewDefault =
    Math.abs(scale - 1) < 0.01 && nodePositions.size === 0;

  const showEdgeLabels = scale >= EDGE_LABEL_MIN_SCALE;
  const showNodeLabels = scale >= NODE_LABEL_MIN_SCALE;
  const isLargeGraph = layout.strategy === "force";

  // Adaptive SVG element height: large graphs get more screen real estate so
  // node/label sizes stay legible at the default zoom.
  const svgMaxHeight = isLargeGraph ? 560 : 440;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[0.75rem] border border-(--fa-border) bg-(--fa-surface)">
      <div
        className="flex items-center justify-between gap-3 px-4 py-2"
        style={{
          borderBottom: "1px solid var(--fa-border)",
          background: "var(--fa-surface-raised)",
        }}
      >
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--fa-text)" }}
        >
          State Diagram
        </h3>
        <div className="flex items-center gap-2">
          {violations.length > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-bold"
              style={{
                background: "var(--fa-red-dim)",
                color: "var(--fa-red)",
                border: "1px solid rgba(255, 82, 82, 0.3)",
              }}
            >
              ⚠ {violations.length} DFA violation
              {violations.length > 1 ? "s" : ""}
            </span>
          )}
          <ZoomControls
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={resetGraph}
            resetDisabled={isViewDefault}
          />
        </div>
      </div>
      <div
        className="relative"
        style={{
          background: "var(--fa-bg, #0a0a0a)",
        }}
      >
        <svg
          ref={(element) => {
            svgElementRef.current = element;
            setSvgRef(element);
          }}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="xMidYMid meet"
          className="block w-full select-none"
          style={{
            maxHeight: svgMaxHeight,
            minHeight: 320,
            aspectRatio: `${layout.width} / ${layout.height}`,
            cursor: isPanning ? "grabbing" : "grab",
            touchAction: "none",
          }}
          onMouseDown={onMouseDown}
        >
          <defs>
            <filter
              id="fa-glow-cyan"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter
              id="fa-glow-green"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter
              id="fa-glow-red"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <marker
              id="fa-arrow"
              markerWidth="10"
              markerHeight="8"
              refX="9"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path
                d="M 0 0 L 10 4 L 0 8 z"
                fill="var(--fa-purple, #b388ff)"
                opacity="0.6"
              />
            </marker>
            <marker
              id="fa-arrow-active"
              markerWidth="10"
              markerHeight="8"
              refX="9"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 0 0 L 10 4 L 0 8 z" fill="var(--fa-cyan, #00e5ff)" />
            </marker>
            <marker
              id="fa-arrow-violation"
              markerWidth="10"
              markerHeight="8"
              refX="9"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 0 0 L 10 4 L 0 8 z" fill="var(--fa-red, #ff5252)" />
            </marker>
          </defs>

          {/* Background — uses layout dims so it stays put while panning */}
          <rect
            x={0}
            y={0}
            width={layout.width}
            height={layout.height}
            rx={12}
            fill="var(--fa-bg, #0a0a0a)"
          />

          {/* Edges */}
          {layout.edges.map((edge, i) => {
            const isActive =
              !!lastTransition &&
              lastTransition.fromStates.includes(edge.from) &&
              lastTransition.toStates.includes(edge.to) &&
              edge.symbols.includes(lastTransition.symbol);

            const edgeKey = `${edge.from}__${edge.to}`;
            const isViolation = violationEdgeKeys.has(edgeKey);

            // Always render labels for active or violating edges so the
            // simulation focus point stays legible even when zoomed out.
            const showLabel = showEdgeLabels || isActive || isViolation;

            if (edge.from === edge.to) {
              const node = resolvePos(edge.from);
              if (!node) return null;
              return (
                <SelfLoop
                  key={i}
                  node={node}
                  label={edge.symbols.join(", ")}
                  isActive={isActive}
                  isViolation={isViolation}
                  showLabel={showLabel}
                />
              );
            }

            const fromNode = resolvePos(edge.from);
            const toNode = resolvePos(edge.to);
            if (!fromNode || !toNode) return null;

            return (
              <CurvedEdge
                key={i}
                from={fromNode}
                to={toNode}
                label={edge.symbols.join(", ")}
                isActive={isActive}
                isViolation={isViolation}
                curveOffset={edge.curveOffset}
                showLabel={showLabel}
              />
            );
          })}

          {/* Start arrow */}
          {(() => {
            const start = resolvePos(program.startState);
            if (!start) return null;
            const ax = start.x - NODE_RADIUS - 4;
            return (
              <g>
                <line
                  x1={start.x - NODE_RADIUS - 28}
                  y1={start.y}
                  x2={ax}
                  y2={start.y}
                  stroke="var(--fa-text-dim, #888)"
                  strokeWidth={2}
                  markerEnd="url(#fa-arrow)"
                />
                <text
                  x={start.x - NODE_RADIUS - 32}
                  y={start.y - 6}
                  textAnchor="end"
                  fill="var(--fa-text-dim, #888)"
                  fontSize="10"
                  fontWeight="500"
                >
                  start
                </text>
              </g>
            );
          })()}

          {/* Nodes */}
          {layout.nodes.map((node) => {
            const isActive = activeSet.has(node.id);
            const isAccept = acceptSet.has(node.id);
            const hasViolation = violatingStates.has(node.id);
            const override = nodePositions.get(node.id);
            const cx = override?.x ?? node.x;
            const cy = override?.y ?? node.y;

            return (
              <g
                key={node.id}
                filter={isActive ? "url(#fa-glow-cyan)" : undefined}
                onMouseDown={(event) => {
                  // Left-button only; stop the SVG pan handler from also firing.
                  if (event.button !== 0) return;
                  event.preventDefault();
                  event.stopPropagation();
                  setDraggedNodeId(node.id);
                }}
                style={{
                  cursor: draggedNodeId === node.id ? "grabbing" : "grab",
                }}
              >
                {isAccept && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={NODE_RADIUS + ACCEPT_RING_GAP}
                    fill="none"
                    stroke={isActive ? "var(--fa-cyan)" : "var(--fa-green)"}
                    strokeWidth={1.5}
                    filter={isActive ? undefined : "url(#fa-glow-green)"}
                  />
                )}

                {hasViolation && !isActive && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={
                      NODE_RADIUS +
                      (isAccept ? ACCEPT_RING_GAP + 4 : ACCEPT_RING_GAP)
                    }
                    fill="none"
                    stroke="var(--fa-red)"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    filter="url(#fa-glow-red)"
                  />
                )}

                <circle
                  cx={cx}
                  cy={cy}
                  r={NODE_RADIUS}
                  fill={
                    isActive
                      ? "var(--fa-cyan-dim)"
                      : hasViolation
                        ? "var(--fa-red-dim)"
                        : "var(--fa-node-fill, var(--fa-surface, #141414))"
                  }
                  stroke={
                    isActive
                      ? "var(--fa-cyan)"
                      : hasViolation
                        ? "var(--fa-red)"
                        : "var(--fa-node-stroke, var(--fa-border, rgba(255,255,255,0.08)))"
                  }
                  strokeWidth={isActive ? 2.5 : 1.5}
                  style={{ transition: "fill 0.3s, stroke 0.3s" }}
                />

                {(showNodeLabels || isActive || hasViolation) && (
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    fill={
                      isActive ? "var(--fa-cyan)" : "var(--fa-text, #e0e0e0)"
                    }
                    fontSize="12"
                    fontWeight="700"
                    style={{ userSelect: "none", transition: "fill 0.3s" }}
                  >
                    {node.id}
                  </text>
                )}

                {hasViolation && (
                  <g>
                    <circle
                      cx={cx + NODE_RADIUS * 0.7}
                      cy={cy - NODE_RADIUS * 0.7}
                      r={7}
                      fill="var(--fa-red)"
                    />
                    <text
                      x={cx + NODE_RADIUS * 0.7}
                      y={cy - NODE_RADIUS * 0.7 + 3.5}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="9"
                      fontWeight="800"
                    >
                      !
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hint overlay for first-time discovery */}
        <div className="text-foreground bg-background/80 border-border pointer-events-none absolute right-2 bottom-2 rounded border px-2 py-0.5 text-[10px]">
          drag node to move · drag canvas to pan · scroll to zoom ·{" "}
          {Math.round(scale * 100)}%
        </div>
      </div>

      {violations.length > 0 && (
        <div
          className="px-4 py-3"
          style={{ borderTop: "1px solid var(--fa-border)" }}
        >
          {violations.map((v, i) => (
            <ViolationTooltip key={i} violation={v} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Zoom controls ──────────────────────────────────────────────────── */

function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
  resetDisabled,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  resetDisabled: boolean;
}) {
  const btnStyle: React.CSSProperties = {
    background: "var(--fa-surface)",
    border: "1px solid var(--fa-border)",
    color: "var(--fa-text)",
    width: 26,
    height: 26,
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
  return (
    <div className="flex items-center gap-1" data-no-pan>
      <button
        type="button"
        aria-label="Zoom out"
        title="Zoom out"
        onClick={onZoomOut}
        style={btnStyle}
      >
        −
      </button>
      <button
        type="button"
        aria-label="Reset view"
        title="Reset view"
        onClick={onReset}
        disabled={resetDisabled}
        style={{ ...btnStyle, opacity: resetDisabled ? 0.5 : 1 }}
      >
        <RotateCcw size={14} />
      </button>
      <button
        type="button"
        aria-label="Zoom in"
        title="Zoom in"
        onClick={onZoomIn}
        style={btnStyle}
      >
        +
      </button>
    </div>
  );
}

/* ── Violation tooltip ──────────────────────────────────────────────── */

function ViolationTooltip({ violation }: { violation: DFAViolation }) {
  return (
    <div
      className="mb-1 flex items-start gap-2 rounded px-2 py-1.5 text-xs"
      style={{
        background: "var(--fa-red-dim)",
        color: "var(--fa-red)",
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
      <span>
        {violation.type === "epsilon" ? (
          <>
            State <strong>{violation.state}</strong> has an ε-transition — not
            allowed in a DFA.
          </>
        ) : (
          <>
            State <strong>{violation.state}</strong> on symbol{" "}
            <strong>'{violation.symbol}'</strong> goes to{" "}
            <strong>{violation.targets.join(", ")}</strong> — this violates DFA
            determinism.
          </>
        )}
      </span>
    </div>
  );
}

/* ── Self-loop edge ─────────────────────────────────────────────────── */

function SelfLoop({
  node,
  label,
  isActive,
  isViolation,
  showLabel,
}: {
  node: NodeLayout;
  label: string;
  isActive: boolean;
  isViolation: boolean;
  showLabel: boolean;
}) {
  const cx = node.x;
  const cy = node.y;
  const r = NODE_RADIUS;
  const startX = cx - r * 0.45;
  const startY = cy - r * 0.9;
  const endX = cx + r * 0.45;
  const endY = cy - r * 0.9;
  const ctrl1X = cx - r * 1.4;
  const ctrl1Y = cy - r * 2.4;
  const ctrl2X = cx + r * 1.4;
  const ctrl2Y = cy - r * 2.4;

  const labelY = cy - r * 1.95;
  const labelWidth = Math.max(label.length * 7 + 10, 18);
  const labelHeight = 16;

  const edgeColor = isActive
    ? "var(--fa-cyan)"
    : isViolation
      ? "var(--fa-red)"
      : "var(--fa-purple)";
  const edgeOpacity = isActive || isViolation ? 1 : 0.45;
  const markerEnd = isActive
    ? "url(#fa-arrow-active)"
    : isViolation
      ? "url(#fa-arrow-violation)"
      : "url(#fa-arrow)";

  return (
    <g>
      <path
        d={`M ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`}
        fill="none"
        stroke={edgeColor}
        strokeWidth={isActive ? 2.5 : 1.5}
        opacity={edgeOpacity}
        markerEnd={markerEnd}
        style={{ transition: "all 0.3s" }}
      />
      {showLabel && (
        <>
          <rect
            x={cx - labelWidth / 2}
            y={labelY - labelHeight / 2}
            width={labelWidth}
            height={labelHeight}
            rx={4}
            fill={
              isActive
                ? "var(--fa-cyan-dim)"
                : isViolation
                  ? "var(--fa-red-dim)"
                  : "var(--fa-surface)"
            }
            stroke={
              isActive
                ? "rgba(0,229,255,0.3)"
                : isViolation
                  ? "rgba(255,82,82,0.3)"
                  : "var(--fa-border-subtle)"
            }
            strokeWidth={1}
          />
          <text
            x={cx}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={edgeColor}
            fontSize="11"
            fontWeight="700"
            style={{ userSelect: "none" }}
          >
            {label}
          </text>
        </>
      )}
    </g>
  );
}

/* ── Curved edge ────────────────────────────────────────────────────── */

function CurvedEdge({
  from,
  to,
  label,
  isActive,
  isViolation,
  curveOffset,
  showLabel,
}: {
  from: NodeLayout;
  to: NodeLayout;
  label: string;
  isActive: boolean;
  isViolation: boolean;
  curveOffset: number;
  showLabel: boolean;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;
  const px = -ny;
  const py = nx;

  const startX = from.x + nx * NODE_RADIUS;
  const startY = from.y + ny * NODE_RADIUS;
  const endX = to.x - nx * (NODE_RADIUS + 4);
  const endY = to.y - ny * (NODE_RADIUS + 4);

  const ctrlX = (startX + endX) / 2 + px * curveOffset;
  const ctrlY = (startY + endY) / 2 + py * curveOffset;

  const apexX = 0.25 * startX + 0.5 * ctrlX + 0.25 * endX;
  const apexY = 0.25 * startY + 0.5 * ctrlY + 0.25 * endY;

  const sign = curveOffset >= 0 ? 1 : -1;
  const labelX = apexX + px * sign * 10;
  const labelY = apexY + py * sign * 10;
  const labelWidth = Math.max(label.length * 7 + 10, 18);
  const labelHeight = 16;

  const edgeColor = isActive
    ? "var(--fa-cyan)"
    : isViolation
      ? "var(--fa-red)"
      : "var(--fa-purple)";
  const edgeOpacity = isActive || isViolation ? 1 : 0.45;
  const markerEnd = isActive
    ? "url(#fa-arrow-active)"
    : isViolation
      ? "url(#fa-arrow-violation)"
      : "url(#fa-arrow)";

  return (
    <g>
      <path
        d={`M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`}
        fill="none"
        stroke={edgeColor}
        strokeWidth={isActive ? 2.5 : 1.5}
        opacity={edgeOpacity}
        markerEnd={markerEnd}
        style={{ transition: "all 0.3s" }}
      />
      {showLabel && (
        <>
          <rect
            x={labelX - labelWidth / 2}
            y={labelY - labelHeight / 2}
            width={labelWidth}
            height={labelHeight}
            rx={4}
            fill={
              isActive
                ? "var(--fa-cyan-dim)"
                : isViolation
                  ? "var(--fa-red-dim)"
                  : "var(--fa-surface)"
            }
            stroke={
              isActive
                ? "rgba(0,229,255,0.3)"
                : isViolation
                  ? "rgba(255,82,82,0.3)"
                  : "var(--fa-border-subtle)"
            }
            strokeWidth={1}
          />
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={edgeColor}
            fontSize="11"
            fontWeight="700"
            style={{ userSelect: "none" }}
          >
            {label}
          </text>
        </>
      )}
    </g>
  );
}

import { useMemo } from "react";
import type { FAProgram } from "../domain/faTypes";
import type { FARuntime } from "../domain/faRuntime";
import {
  findDFAViolations,
  buildViolationEdgeKeys,
  type DFAViolation,
} from "../domain/faDeterminismCheck";

interface FAStateDiagramProps {
  program: FAProgram;
  runtime: FARuntime;
}

const NODE_RADIUS = 28;
const ACCEPT_RING_GAP = 5;

/**
 * SVG state diagram with neon theme, glow effects, and DFA violation
 * highlights. Parallel edges between the same node pair are merged into
 * one edge with a combined label.
 */
export function FAStateDiagram({ program, runtime }: FAStateDiagramProps) {
  const layout = useMemo(() => computeLayout(program), [program]);

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

  return (
    <div
      className="fa-card flex h-full flex-col overflow-hidden"
      style={{ background: "var(--fa-surface)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-2"
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
      </div>
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="mx-auto h-auto w-full"
        style={{ maxHeight: 420 }}
      >
        <defs>
          {/* Glow filter for active states */}
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
          <filter id="fa-glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Arrow markers */}
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

        {/* Background */}
        <rect
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

          if (edge.from === edge.to) {
            return (
              <SelfLoop
                key={i}
                node={layout.nodeMap.get(edge.from)!}
                label={edge.symbols.join(", ")}
                isActive={isActive}
                isViolation={isViolation}
              />
            );
          }

          return (
            <CurvedEdge
              key={i}
              from={layout.nodeMap.get(edge.from)!}
              to={layout.nodeMap.get(edge.to)!}
              label={edge.symbols.join(", ")}
              isActive={isActive}
              isViolation={isViolation}
              curveOffset={edge.curveOffset}
            />
          );
        })}

        {/* Start arrow */}
        {(() => {
          const start = layout.nodeMap.get(program.startState);
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

          return (
            <g
              key={node.id}
              filter={isActive ? "url(#fa-glow-cyan)" : undefined}
            >
              {/* Accept state outer ring */}
              {isAccept && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS + ACCEPT_RING_GAP}
                  fill="none"
                  stroke={isActive ? "var(--fa-cyan)" : "var(--fa-green)"}
                  strokeWidth={1.5}
                  filter={isActive ? undefined : "url(#fa-glow-green)"}
                />
              )}

              {/* Violation ring */}
              {hasViolation && !isActive && (
                <circle
                  cx={node.x}
                  cy={node.y}
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

              {/* Main circle */}
              <circle
                cx={node.x}
                cy={node.y}
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
                style={{ transition: "all 0.3s" }}
              />

              {/* Label */}
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fill={isActive ? "var(--fa-cyan)" : "var(--fa-text, #e0e0e0)"}
                fontSize="12"
                fontWeight="700"
                style={{ userSelect: "none", transition: "fill 0.3s" }}
              >
                {node.id}
              </text>

              {/* Violation tooltip indicator */}
              {hasViolation && (
                <g>
                  <circle
                    cx={node.x + NODE_RADIUS * 0.7}
                    cy={node.y - NODE_RADIUS * 0.7}
                    r={7}
                    fill="var(--fa-red)"
                  />
                  <text
                    x={node.x + NODE_RADIUS * 0.7}
                    y={node.y - NODE_RADIUS * 0.7 + 3.5}
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

      {/* DFA violations list */}
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
}: {
  node: { x: number; y: number };
  label: string;
  isActive: boolean;
  isViolation: boolean;
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
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  label: string;
  isActive: boolean;
  isViolation: boolean;
  curveOffset: number;
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
    </g>
  );
}

/* ── Layout computation ─────────────────────────────────────────────── */

interface NodeLayout {
  id: string;
  x: number;
  y: number;
}

interface EdgeLayout {
  from: string;
  to: string;
  symbols: string[];
  curveOffset: number;
}

function computeLayout(program: FAProgram): {
  nodes: NodeLayout[];
  nodeMap: Map<string, NodeLayout>;
  edges: EdgeLayout[];
  width: number;
  height: number;
} {
  const n = program.states.length;
  const width = 640;
  const height = 360;

  let nodes: NodeLayout[];

  if (n === 0) {
    nodes = [];
  } else if (n === 1) {
    nodes = [{ id: program.states[0], x: width / 2, y: height / 2 }];
  } else if (n === 2) {
    nodes = program.states.map((s, i) => ({
      id: s,
      x: width / 3 + i * (width / 3),
      y: height / 2,
    }));
  } else {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - NODE_RADIUS - 50;
    nodes = program.states.map((state, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
      return {
        id: state,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  const grouped = new Map<
    string,
    { from: string; to: string; symbols: string[] }
  >();

  for (const fromState of Object.keys(program.transitions)) {
    const symMap = program.transitions[fromState];
    for (const symbol of Object.keys(symMap)) {
      for (const toState of symMap[symbol]) {
        const key = `${fromState}__${toState}`;
        const existing = grouped.get(key);
        if (existing) {
          if (!existing.symbols.includes(symbol)) existing.symbols.push(symbol);
        } else {
          grouped.set(key, {
            from: fromState,
            to: toState,
            symbols: [symbol],
          });
        }
      }
    }
  }

  const edges: EdgeLayout[] = [];
  for (const e of grouped.values()) {
    if (e.from === e.to) {
      edges.push({ ...e, curveOffset: 0 });
    } else {
      const reverseKey = `${e.to}__${e.from}`;
      const hasReverse = grouped.has(reverseKey);
      const offset = hasReverse ? 55 : 35;
      edges.push({ ...e, curveOffset: offset });
    }
  }

  return { nodes, nodeMap, edges, width, height };
}

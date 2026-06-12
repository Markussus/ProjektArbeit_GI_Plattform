import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { BooleanExpression } from "@/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";

interface LogicGateDiagramProps {
  expression: BooleanExpression | null;
  outputName: string;
  variables: string[];
  unavailableText: string;
}

interface DiagramNode {
  id: number;
  label: string;
  kind: "input" | "not" | "and" | "or" | "constant";
  depth: number;
  order: number;
  children: number[];
}

interface SelectedConnection {
  sourceId: number;
  targetId: number | "output";
}

export function LogicGateDiagram({
  expression,
  outputName,
  variables,
  unavailableText,
}: LogicGateDiagramProps) {
  const diagram = useMemo(
    () => (expression ? buildDiagram(expression) : null),
    [expression],
  );
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [selectedConnection, setSelectedConnection] =
    useState<SelectedConnection | null>(null);

  if (!diagram) {
    return (
      <div className="border-border bg-muted/20 rounded-xl border border-dashed p-10 text-center text-sm">
        {unavailableText}
      </div>
    );
  }

  const width = Math.max(680, (diagram.maxDepth + 2) * 180);
  const height = Math.max(340, diagram.leafCount * 76 + 80);
  const positions = new Map<number, { x: number; y: number }>();
  const depthGroups = new Map<number, DiagramNode[]>();

  for (const node of diagram.nodes) {
    const group = depthGroups.get(node.depth) ?? [];
    group.push(node);
    depthGroups.set(node.depth, group);
  }
  for (const [depth, nodes] of depthGroups) {
    nodes.sort((left, right) => left.order - right.order);
    nodes.forEach((node, index) => {
      positions.set(node.id, {
        x: 90 + depth * 170,
        y: ((index + 1) * height) / (nodes.length + 1),
      });
    });
  }

  const rootPosition = positions.get(diagram.rootId);
  const outputX = width - 70;

  return (
    <div className="border-border bg-muted/10 overflow-auto rounded-xl border">
      <svg
        data-testid="moore-logic-gate-diagram"
        role="img"
        aria-label={`${outputName} logic gate diagram`}
        viewBox={`0 0 ${width} ${height}`}
        className="min-h-80 w-full min-w-[680px]"
      >
        <defs>
          <marker
            id="logic-arrow"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 8 3 L 0 6 z" className="fill-muted-foreground" />
          </marker>
          <marker
            id="logic-arrow-selected"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 8 3 L 0 6 z" className="fill-brand" />
          </marker>
        </defs>

        {diagram.nodes.flatMap((node) => {
          const target = positions.get(node.id);
          if (!target) {
            return [];
          }
          return node.children.map((childId) => {
            const source = positions.get(childId);
            if (!source) {
              return null;
            }
            const selected =
              selectedConnection?.sourceId === childId &&
              selectedConnection.targetId === node.id;
            const path = `M ${source.x + 50} ${source.y} C ${source.x + 90} ${source.y}, ${target.x - 90} ${target.y}, ${target.x - 50} ${target.y}`;
            return (
              <g key={`${childId}-${node.id}`}>
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedNodeId(null);
                    setSelectedConnection({
                      sourceId: childId,
                      targetId: node.id,
                    });
                  }}
                />
                <path
                  data-testid={`moore-logic-wire-${childId}-${node.id}`}
                  d={path}
                  fill="none"
                  pointerEvents="none"
                  className={cn(
                    "stroke-muted-foreground",
                    selected && "stroke-brand",
                  )}
                  strokeWidth={selected ? 4 : 2}
                  markerEnd={
                    selected
                      ? "url(#logic-arrow-selected)"
                      : "url(#logic-arrow)"
                  }
                />
              </g>
            );
          });
        })}

        {rootPosition && (
          <>
            <line
              x1={rootPosition.x + 50}
              y1={rootPosition.y}
              x2={outputX}
              y2={rootPosition.y}
              stroke="transparent"
              strokeWidth="16"
              className="cursor-pointer"
              onClick={() => {
                setSelectedNodeId(null);
                setSelectedConnection({
                  sourceId: diagram.rootId,
                  targetId: "output",
                });
              }}
            />
            <line
              data-testid={`moore-logic-wire-${diagram.rootId}-output`}
              x1={rootPosition.x + 50}
              y1={rootPosition.y}
              x2={outputX}
              y2={rootPosition.y}
              pointerEvents="none"
              className={cn(
                "stroke-muted-foreground",
                selectedConnection?.sourceId === diagram.rootId &&
                  selectedConnection.targetId === "output" &&
                  "stroke-brand",
              )}
              strokeWidth={
                selectedConnection?.sourceId === diagram.rootId &&
                selectedConnection.targetId === "output"
                  ? 4
                  : 2
              }
              markerEnd={
                selectedConnection?.sourceId === diagram.rootId &&
                selectedConnection.targetId === "output"
                  ? "url(#logic-arrow-selected)"
                  : "url(#logic-arrow)"
              }
            />
            <circle
              cx={outputX + 8}
              cy={rootPosition.y}
              r="5"
              className={cn(
                "fill-muted-foreground",
                selectedConnection?.targetId === "output" && "fill-brand",
              )}
            />
            <text
              x={outputX + 20}
              y={rootPosition.y + 5}
              className={cn(
                "fill-foreground text-sm font-bold",
                selectedConnection?.targetId === "output" && "fill-brand",
              )}
            >
              {outputName}
            </text>
          </>
        )}

        {diagram.nodes.map((node) => {
          const position = positions.get(node.id);
          if (!position) {
            return null;
          }
          return (
            <GateNode
              key={node.id}
              node={node}
              x={position.x}
              y={position.y}
              selected={
                selectedNodeId === node.id ||
                selectedConnection?.sourceId === node.id ||
                selectedConnection?.targetId === node.id
              }
              onSelect={() => {
                setSelectedConnection(null);
                setSelectedNodeId(node.id);
              }}
            />
          );
        })}

        <text x="20" y="28" className="fill-muted-foreground text-xs">
          {variables.join(", ")}
        </text>
      </svg>
    </div>
  );
}

function GateNode({
  node,
  x,
  y,
  selected,
  onSelect,
}: {
  node: DiagramNode;
  x: number;
  y: number;
  selected: boolean;
  onSelect: () => void;
}) {
  if (node.kind === "input" || node.kind === "constant") {
    return (
      <g
        data-testid={`moore-logic-node-${node.id}`}
        onClick={onSelect}
        className="cursor-pointer"
      >
        <circle
          cx={x}
          cy={y}
          r={selected ? 9 : 6}
          className={selected ? "fill-brand" : "fill-foreground"}
        />
        <text
          x={x - 14}
          y={y + 5}
          textAnchor="end"
          className={cn(
            "fill-foreground font-mono text-sm font-semibold",
            selected && "fill-brand",
          )}
        >
          {node.label}
        </text>
      </g>
    );
  }

  return (
    <g
      data-testid={`moore-logic-node-${node.id}`}
      onClick={onSelect}
      className="cursor-pointer"
    >
      <rect
        x={x - 42}
        y={y - 28}
        width="84"
        height="56"
        rx="5"
        className={
          selected
            ? "fill-brand/15 stroke-brand"
            : "fill-card stroke-foreground"
        }
        strokeWidth={selected ? 4 : 2}
      />
      <text
        x={x}
        y={y + 6}
        textAnchor="middle"
        className="fill-foreground text-lg font-bold"
      >
        {node.kind === "and" ? "&" : node.kind === "or" ? "≥1" : "1"}
      </text>
      {node.kind === "not" && (
        <circle
          cx={x + 48}
          cy={y}
          r="6"
          className="fill-card stroke-foreground"
          strokeWidth="2"
        />
      )}
    </g>
  );
}

function buildDiagram(expression: BooleanExpression) {
  let nextId = 0;
  let leafOrder = 0;
  const nodes: DiagramNode[] = [];

  const visit = (node: BooleanExpression): { id: number; depth: number } => {
    const id = nextId++;
    if (node.type === "variable") {
      nodes.push({
        id,
        label: node.name,
        kind: "input",
        depth: 0,
        order: leafOrder++,
        children: [],
      });
      return { id, depth: 0 };
    }
    if (node.type === "constant") {
      nodes.push({
        id,
        label: node.value ? "1" : "0",
        kind: "constant",
        depth: 0,
        order: leafOrder++,
        children: [],
      });
      return { id, depth: 0 };
    }
    if (node.type === "not") {
      const child = visit(node.operand);
      nodes.push({
        id,
        label: "NOT",
        kind: "not",
        depth: child.depth + 1,
        order: leafOrder++,
        children: [child.id],
      });
      return { id, depth: child.depth + 1 };
    }

    const left = visit(node.left);
    const right = visit(node.right);
    const depth = Math.max(left.depth, right.depth) + 1;
    nodes.push({
      id,
      label: node.operator.toUpperCase(),
      kind: node.operator,
      depth,
      order: leafOrder++,
      children: [left.id, right.id],
    });
    return { id, depth };
  };

  const root = visit(expression);
  return {
    nodes,
    rootId: root.id,
    maxDepth: root.depth,
    leafCount: Math.max(
      1,
      nodes.filter((node) => node.kind === "input" || node.kind === "constant")
        .length,
    ),
  };
}

import type { FAProgram } from "./faTypes";

export interface NodeLayout {
  id: string;
  x: number;
  y: number;
}

export interface EdgeLayout {
  from: string;
  to: string;
  symbols: string[];
  curveOffset: number;
}

export type LayoutStrategy = "single" | "pair" | "circular" | "force";

export interface GraphLayout {
  nodes: NodeLayout[];
  nodeMap: Map<string, NodeLayout>;
  edges: EdgeLayout[];
  width: number;
  height: number;
  strategy: LayoutStrategy;
  /** Unscaled radius used for nodes (in viewBox units). */
  nodeRadius: number;
}

export interface LayoutOptions {
  /** Node circle radius in viewBox units. */
  nodeRadius: number;
  /** Padding around the graph in viewBox units. */
  padding: number;
}

const DEFAULT_OPTIONS: LayoutOptions = {
  nodeRadius: 28,
  padding: 70,
};

/** From this many states on, a circle gets too crowded — use forces instead. */
const FORCE_LAYOUT_MIN_STATES = 9;

export function computeLayout(
  program: FAProgram,
  options: Partial<LayoutOptions> = {},
): GraphLayout {
  const opts: LayoutOptions = { ...DEFAULT_OPTIONS, ...options };
  const n = program.states.length;

  let strategy: LayoutStrategy;
  let nodes: NodeLayout[];

  if (n === 0) {
    return {
      nodes: [],
      nodeMap: new Map(),
      edges: [],
      width: 320,
      height: 200,
      strategy: "single",
      nodeRadius: opts.nodeRadius,
    };
  }

  if (n === 1) {
    strategy = "single";
    nodes = [{ id: program.states[0], x: 0, y: 0 }];
  } else if (n === 2) {
    strategy = "pair";
    const dx = opts.nodeRadius * 4;
    nodes = program.states.map((id, i) => ({
      id,
      x: (i - 0.5) * 2 * dx,
      y: 0,
    }));
  } else if (n < FORCE_LAYOUT_MIN_STATES) {
    strategy = "circular";
    nodes = circularLayout(program.states, opts.nodeRadius);
  } else {
    strategy = "force";
    nodes = forceDirectedLayout(program, opts.nodeRadius);
  }

  resolveOverlaps(nodes, opts.nodeRadius);

  const bounds = computeBounds(nodes);
  const offsetX = opts.padding - bounds.minX + opts.nodeRadius;
  const offsetY = opts.padding - bounds.minY + opts.nodeRadius;
  for (const node of nodes) {
    node.x += offsetX;
    node.y += offsetY;
  }

  const width =
    bounds.maxX - bounds.minX + opts.padding * 2 + opts.nodeRadius * 2;
  const height =
    bounds.maxY - bounds.minY + opts.padding * 2 + opts.nodeRadius * 2;

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const edges = buildEdges(program);

  return {
    nodes,
    nodeMap,
    edges,
    width: Math.max(width, 320),
    height: Math.max(height, 220),
    strategy,
    nodeRadius: opts.nodeRadius,
  };
}

/* ── Layout strategies ──────────────────────────────────────────────── */

function circularLayout(states: string[], nodeRadius: number): NodeLayout[] {
  const n = states.length;
  const minSpacing = nodeRadius * 2 + 40;
  const radius = Math.max(120, (minSpacing * n) / (2 * Math.PI));
  return states.map((id, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return {
      id,
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    };
  });
}

/**
 * Fruchterman–Reingold force-directed layout. Deterministic given the same
 * input (initial positions seeded by string hash so symmetric automata don't
 * collapse to a degenerate configuration).
 */
function forceDirectedLayout(
  program: FAProgram,
  nodeRadius: number,
): NodeLayout[] {
  const n = program.states.length;
  const k = Math.max(140, nodeRadius * 3 + n * 2);

  const initialRadius = (k * n) / (2 * Math.PI);
  const nodes: NodeLayout[] = program.states.map((id, i) => {
    const angle = (2 * Math.PI * i) / n;
    const jitter = (hashString(id) % 1000) / 1000;
    const r = initialRadius * (0.85 + jitter * 0.3);
    return { id, x: r * Math.cos(angle), y: r * Math.sin(angle) };
  });

  const edgePairs = buildUndirectedEdges(program);
  const idToIdx = new Map(nodes.map((node, i) => [node.id, i]));

  const iterations = Math.min(220, 80 + n * 4);
  let temperature = k * 1.2;
  const cooling = Math.pow(0.02, 1 / iterations);

  for (let iter = 0; iter < iterations; iter++) {
    const forces: Array<{ fx: number; fy: number }> = nodes.map(() => ({
      fx: 0,
      fy: 0,
    }));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq) || 0.01;
        const repel = (k * k) / dist;
        const ux = dx / dist;
        const uy = dy / dist;
        forces[i].fx += ux * repel;
        forces[i].fy += uy * repel;
        forces[j].fx -= ux * repel;
        forces[j].fy -= uy * repel;
      }
    }

    for (const [a, b] of edgePairs) {
      const ai = idToIdx.get(a);
      const bi = idToIdx.get(b);
      if (ai === undefined || bi === undefined) continue;
      const dx = nodes[ai].x - nodes[bi].x;
      const dy = nodes[ai].y - nodes[bi].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const attract = (dist * dist) / k;
      const ux = dx / dist;
      const uy = dy / dist;
      forces[ai].fx -= ux * attract;
      forces[ai].fy -= uy * attract;
      forces[bi].fx += ux * attract;
      forces[bi].fy += uy * attract;
    }

    for (let i = 0; i < n; i++) {
      const fx = forces[i].fx;
      const fy = forces[i].fy;
      const mag = Math.sqrt(fx * fx + fy * fy) || 0.01;
      const limited = Math.min(mag, temperature);
      nodes[i].x += (fx / mag) * limited;
      nodes[i].y += (fy / mag) * limited;
    }

    temperature *= cooling;
  }

  return nodes;
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function buildUndirectedEdges(program: FAProgram): Array<[string, string]> {
  const seen = new Set<string>();
  const result: Array<[string, string]> = [];
  for (const fromState of Object.keys(program.transitions)) {
    const symMap = program.transitions[fromState];
    for (const symbol of Object.keys(symMap)) {
      for (const toState of symMap[symbol]) {
        if (fromState === toState) continue;
        const a = fromState < toState ? fromState : toState;
        const b = fromState < toState ? toState : fromState;
        const key = `${a}__${b}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push([a, b]);
      }
    }
  }
  return result;
}

function buildEdges(program: FAProgram): EdgeLayout[] {
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
          if (!existing.symbols.includes(symbol)) {
            existing.symbols.push(symbol);
          }
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
      edges.push({ ...e, curveOffset: hasReverse ? 55 : 35 });
    }
  }
  return edges;
}

function computeBounds(nodes: NodeLayout[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.x > maxX) maxX = n.x;
    if (n.y > maxY) maxY = n.y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Push apart any nodes whose centers are closer than 2*radius + margin.
 * Idempotent — typically converges in <20 passes even for dense graphs.
 */
function resolveOverlaps(nodes: NodeLayout[], nodeRadius: number): void {
  const minDist = nodeRadius * 2 + 24;
  const minDistSq = minDist * minDist;

  for (let pass = 0; pass < 60; pass++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const distSq = dx * dx + dy * dy;
        if (distSq >= minDistSq) continue;
        const dist = Math.sqrt(distSq) || 0.01;
        const push = (minDist - dist) / 2 + 0.5;
        const ux = dx / dist;
        const uy = dy / dist;
        nodes[i].x -= ux * push;
        nodes[i].y -= uy * push;
        nodes[j].x += ux * push;
        nodes[j].y += uy * push;
        moved = true;
      }
    }
    if (!moved) return;
  }
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

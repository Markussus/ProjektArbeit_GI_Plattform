export interface Point {
  x: number;
  y: number;
}

interface IdentifiedNode {
  id: string;
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface GraphLayout {
  width: number;
  height: number;
  positions: Map<string, Point>;
}

export interface DirectedEdgeGeometry {
  start: Point;
  end: Point;
  label: Point;
  control?: Point;
}

export interface SelfLoopGeometry {
  path: string;
  label: Point;
}

function calculateLayoutRadius(nodeCount: number, nodeRadius: number): number {
  if (nodeCount <= 1) return 0;
  if (nodeCount === 2) return 120;
  return Math.max(120, (nodeCount * (nodeRadius * 2 + 55)) / (2 * Math.PI));
}

function createRawPositions(
  nodes: IdentifiedNode[],
  radius: number,
): Map<string, Point> {
  return new Map(
    nodes.map((node, index) => {
      const angle =
        nodes.length === 2
          ? index === 0
            ? Math.PI
            : 0
          : -Math.PI / 2 + (index * Math.PI * 2) / Math.max(nodes.length, 1);
      return [
        node.id,
        { x: radius * Math.cos(angle), y: radius * Math.sin(angle) },
      ];
    }),
  );
}

function calculateBounds(points: Iterable<Point>): Bounds {
  const bounds: Bounds = {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
  };
  for (const point of points) {
    bounds.minX = Math.min(bounds.minX, point.x);
    bounds.maxX = Math.max(bounds.maxX, point.x);
    bounds.minY = Math.min(bounds.minY, point.y);
    bounds.maxY = Math.max(bounds.maxY, point.y);
  }
  return bounds;
}

export function createCircularLayout(
  nodes: IdentifiedNode[],
  nodeRadius: number,
): GraphLayout {
  if (nodes.length === 0) {
    return { width: 300, height: 240, positions: new Map() };
  }

  const radius = calculateLayoutRadius(nodes.length, nodeRadius);
  const rawPositions = createRawPositions(nodes, radius);
  const bounds = calculateBounds(rawPositions.values());
  const padding = {
    left: nodeRadius + 60,
    right: nodeRadius + 50,
    top: nodeRadius + 75,
    bottom: nodeRadius + 50,
  };
  const contentWidth = bounds.maxX - bounds.minX + padding.left + padding.right;
  const contentHeight =
    bounds.maxY - bounds.minY + padding.top + padding.bottom;
  const minimumWidth = nodes.length <= 1 ? 300 : nodes.length === 2 ? 380 : 440;
  const minimumHeight =
    nodes.length <= 1 ? 240 : nodes.length === 2 ? 280 : 360;
  const width = Math.max(minimumWidth, contentWidth);
  const height = Math.max(minimumHeight, contentHeight);
  const offsetX = padding.left - bounds.minX + (width - contentWidth) / 2;
  const offsetY = padding.top - bounds.minY + (height - contentHeight) / 2;
  const positions = new Map(
    [...rawPositions].map(([id, point]) => [
      id,
      { x: point.x + offsetX, y: point.y + offsetY },
    ]),
  );

  return { width, height, positions };
}

export function createDirectedEdgeGeometry(
  from: Point,
  to: Point,
  nodeRadius: number,
  isBidirectional: boolean,
): DirectedEdgeGeometry {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const unit = { x: dx / distance, y: dy / distance };
  const normal = { x: -unit.y, y: unit.x };
  const lateralShift = isBidirectional ? 6 : 0;
  const start = {
    x: from.x + unit.x * nodeRadius + normal.x * lateralShift,
    y: from.y + unit.y * nodeRadius + normal.y * lateralShift,
  };
  const end = {
    x: to.x - unit.x * (nodeRadius + 6) + normal.x * lateralShift,
    y: to.y - unit.y * (nodeRadius + 6) + normal.y * lateralShift,
  };
  const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  const curveAmount = isBidirectional ? 24 : 0;

  return {
    start,
    end,
    control: isBidirectional
      ? {
          x: midpoint.x + normal.x * curveAmount,
          y: midpoint.y + normal.y * curveAmount,
        }
      : undefined,
    label: {
      x: midpoint.x + normal.x * (curveAmount + 14),
      y: midpoint.y + normal.y * (curveAmount + 14),
    },
  };
}

export function createSelfLoopGeometry(
  center: Point,
  nodeRadius: number,
): SelfLoopGeometry {
  const start = {
    x: center.x - nodeRadius * 0.45,
    y: center.y - nodeRadius * 0.9,
  };
  const end = {
    x: center.x + nodeRadius * 0.45,
    y: center.y - nodeRadius * 0.9,
  };
  const control1 = {
    x: center.x - nodeRadius * 1.35,
    y: center.y - nodeRadius * 2.5,
  };
  const control2 = {
    x: center.x + nodeRadius * 1.35,
    y: center.y - nodeRadius * 2.5,
  };

  return {
    path: `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`,
    label: { x: center.x, y: center.y - nodeRadius * 2 },
  };
}

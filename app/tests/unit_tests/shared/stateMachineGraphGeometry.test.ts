import { describe, expect, it } from "vitest";
import {
  createCircularLayout,
  createDirectedEdgeGeometry,
  createSelfLoopGeometry,
} from "@/components/shared/StateMachineGraph/stateMachineGraphGeometry";

describe("stateMachineGraphGeometry", () => {
  it("creates stable layouts for zero, one, two, and multiple nodes", () => {
    expect(createCircularLayout([], 30)).toMatchObject({
      width: 300,
      height: 240,
    });

    const single = createCircularLayout([{ id: "A" }], 30);
    expect(single.positions.get("A")).toEqual({ x: 155, y: 132.5 });

    const pair = createCircularLayout([{ id: "A" }, { id: "B" }], 30);
    expect(pair.width).toBeGreaterThanOrEqual(380);
    expect(pair.positions.size).toBe(2);

    const many = createCircularLayout(
      [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
      36,
    );
    expect(many.positions.size).toBe(4);
    expect(new Set(many.positions.keys())).toEqual(
      new Set(["A", "B", "C", "D"]),
    );
  });

  it("calculates straight and curved directed edges", () => {
    const straight = createDirectedEdgeGeometry(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      30,
      false,
    );
    expect(straight).toMatchObject({
      start: { x: 30, y: 0 },
      end: { x: 64, y: 0 },
    });
    expect(straight.control).toBeUndefined();

    const curved = createDirectedEdgeGeometry(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      30,
      true,
    );
    expect(curved.control).toBeDefined();
    expect(curved.start.y).toBe(6);
  });

  it("calculates a self-loop path and label position", () => {
    const loop = createSelfLoopGeometry({ x: 100, y: 100 }, 30);

    expect(loop.path).toContain("M 86.5 73");
    expect(loop.label).toEqual({ x: 100, y: 40 });
  });
});

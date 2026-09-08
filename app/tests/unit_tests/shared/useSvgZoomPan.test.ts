/** @vitest-environment jsdom */

import { act, fireEvent, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useSvgZoomPan } from "@/hooks/useSvgZoomPan";

class MockDOMPoint {
  x: number;
  y: number;
  z: number;
  w: number;
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
  matrixTransform(matrix: { a?: number; d?: number; e?: number; f?: number }) {
    return new MockDOMPoint(
      this.x * (matrix.a ?? 1) + (matrix.e ?? 0),
      this.y * (matrix.d ?? 1) + (matrix.f ?? 0),
    );
  }
}

describe("useSvgZoomPan", () => {
  beforeEach(() => {
    if (typeof window.DOMPoint === "undefined") {
      (window as unknown as { DOMPoint: typeof MockDOMPoint }).DOMPoint =
        MockDOMPoint;
    }
  });

  it("initializes with content dimensions and scale 1", () => {
    const { result } = renderHook(() => useSvgZoomPan(1000, 600));

    expect(result.current.viewBox).toEqual({
      x: 0,
      y: 0,
      width: 1000,
      height: 600,
    });
    expect(result.current.scale).toBe(1);
    expect(result.current.isPanning).toBe(false);
  });

  it("updates viewBox when zooming in, zooming out, and resetting", () => {
    const { result } = renderHook(() => useSvgZoomPan(1000, 600));

    act(() => {
      result.current.zoomIn();
    });
    // Zoom in decreases viewBox dimensions (higher zoom scale)
    expect(result.current.viewBox.width).toBeLessThan(1000);
    expect(result.current.scale).toBeGreaterThan(1);

    act(() => {
      result.current.zoomOut();
    });
    // Zooming out increases width again
    expect(result.current.scale).toBeCloseTo(1, 1);

    act(() => {
      result.current.reset();
    });
    expect(result.current.viewBox).toEqual({
      x: 0,
      y: 0,
      width: 1000,
      height: 600,
    });
    expect(result.current.scale).toBe(1);
  });

  it("adjusts viewBox to ensure point is visible with padding", () => {
    const { result } = renderHook(() => useSvgZoomPan(1000, 600));

    // Point far to the right (x: 1200)
    act(() => {
      result.current.ensurePointVisible(1200, 300, 50);
    });
    expect(result.current.viewBox.x).toBe(250); // 1200 + 50 - 1000 = 250

    // Point far to the left (x: 100)
    act(() => {
      result.current.ensurePointVisible(100, 300, 50);
    });
    expect(result.current.viewBox.x).toBe(50); // 100 - 50 = 50

    // Point below bottom (y: 800)
    act(() => {
      result.current.ensurePointVisible(500, 800, 50);
    });
    expect(result.current.viewBox.y).toBe(250); // 800 + 50 - 600 = 250

    // Point above top (y: 10)
    act(() => {
      result.current.ensurePointVisible(500, 10, 50);
    });
    expect(result.current.viewBox.y).toBe(-40); // 10 - 50 = -40
  });

  it("handles panning interactions with SVG mock", () => {
    const { result } = renderHook(() => useSvgZoomPan(1000, 600));

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const mockMatrix = {
      inverse: () => ({
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: 0,
        f: 0,
      }),
    };
    svg.getScreenCTM = () => mockMatrix as unknown as DOMMatrix;

    act(() => {
      result.current.setSvgRef(svg);
    });

    // Mouse down starts panning
    act(() => {
      result.current.onMouseDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        target: svg,
      } as unknown as React.MouseEvent<SVGSVGElement>);
    });
    expect(result.current.isPanning).toBe(true);

    // Mouse move on window
    act(() => {
      fireEvent.mouseMove(window, { clientX: 70, clientY: 80 });
    });
    expect(result.current.viewBox.x).toBe(30); // 100 - 70
    expect(result.current.viewBox.y).toBe(20); // 100 - 80

    // Mouse up stops panning
    act(() => {
      fireEvent.mouseUp(window);
    });
    expect(result.current.isPanning).toBe(false);
  });
});

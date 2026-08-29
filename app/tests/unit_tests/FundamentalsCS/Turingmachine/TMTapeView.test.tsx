/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TMTapeView } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/presentation/TMTapeView";

describe("TMTapeView", () => {
  beforeEach(() => {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    Element.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders tape cells and focused head indicator cell", () => {
    const tape: Record<number, string> = {
      0: "1",
      1: "0",
      2: "1",
    };

    render(
      <TMTapeView
        tape={tape}
        headPosition={1}
        blankSymbol="_"
        windowRadius={3}
      />,
    );

    expect(screen.getByTestId("tm-tape-view")).toBeDefined();
    expect(screen.getByTestId("tm-tape-cell-1")).toBeDefined();
    expect(
      screen.getByTestId("tm-tape-cell-1").getAttribute("data-focused"),
    ).toBe("true");
    expect(
      screen.getByTestId("tm-tape-cell-0").getAttribute("data-focused"),
    ).toBe("false");
    expect(screen.getByTestId("tm-tape-cell-value-0").textContent).toBe("1");
    expect(screen.getByTestId("tm-tape-cell-value-1").textContent).toBe("0");
  });

  it("renders with custom cell class name and negative head position", () => {
    const tape: Record<number, string> = {
      "-1": "A",
      0: "B",
    };

    render(
      <TMTapeView
        tape={tape}
        headPosition={-1}
        blankSymbol=" "
        cellClassName="custom-cell"
        windowRadius={2}
      />,
    );

    const cell = screen.getByTestId("tm-tape-cell--1");
    expect(cell.getAttribute("data-focused")).toBe("true");
    expect(screen.getByTestId("tm-tape-cell-value--1").className).toContain(
      "custom-cell",
    );
  });

  it("updates focus when head position changes across re-renders", () => {
    const tape: Record<number, string> = { 0: "0", 1: "1" };
    const { rerender } = render(
      <TMTapeView tape={tape} headPosition={0} blankSymbol="_" />,
    );

    expect(
      screen.getByTestId("tm-tape-cell-0").getAttribute("data-focused"),
    ).toBe("true");

    rerender(<TMTapeView tape={tape} headPosition={1} blankSymbol="_" />);

    expect(
      screen.getByTestId("tm-tape-cell-1").getAttribute("data-focused"),
    ).toBe("true");
    expect(
      screen.getByTestId("tm-tape-cell-0").getAttribute("data-focused"),
    ).toBe("false");
  });
});

// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StateMachineGraph } from "@/components/shared/StateMachineGraph";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const nodes = [
  { id: "A", label: "A", output: "0", isStart: true, isActive: true },
  { id: "B", label: "B", output: "1" },
];
const edges = [
  { from: "A", to: "B", label: "0" },
  { from: "A", to: "B", label: "1" },
  { from: "B", to: "B", label: "1" },
];

describe("StateMachineGraph", () => {
  it("renders Moore outputs and groups parallel transitions", () => {
    render(
      <StateMachineGraph
        nodes={nodes}
        edges={edges}
        ariaLabel="Machine"
        testId="machine"
      />,
    );

    expect(screen.getByRole("img", { name: "Machine" })).toBeVisible();
    expect(screen.getByTestId("state-machine-node-A")).toHaveTextContent("A0");
    expect(screen.getByText("0, 1")).toBeInTheDocument();
  });

  it("uses unique SVG marker ids for multiple graph instances", () => {
    const { container } = render(
      <>
        <StateMachineGraph nodes={nodes} edges={edges} ariaLabel="First" />
        <StateMachineGraph nodes={nodes} edges={edges} ariaLabel="Second" />
      </>,
    );

    const markerIds = Array.from(
      container.querySelectorAll("marker"),
      (marker) => marker.getAttribute("id"),
    );
    expect(new Set(markerIds).size).toBe(markerIds.length);
  });

  it("toggles edge-label layout and supports zoom/reset controls", () => {
    render(
      <StateMachineGraph
        nodes={nodes}
        edges={edges}
        ariaLabel="Machine"
        testId="machine"
      />,
    );

    fireEvent.click(screen.getByTestId("machine-label-layout-toggle"));
    expect(screen.queryByText("0, 1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("machine-zoom-in"));
    expect(screen.getByTestId("machine-zoom-percent-reset")).toHaveTextContent(
      "130%",
    );
    fireEvent.click(screen.getByTestId("machine-reset-view"));
    expect(screen.getByTestId("machine-zoom-percent-reset")).toHaveTextContent(
      "100%",
    );
  });

  it("starts node dragging only with the primary mouse button", () => {
    render(
      <StateMachineGraph
        nodes={nodes}
        edges={edges}
        ariaLabel="Machine"
        testId="machine"
      />,
    );
    const node = screen.getByTestId("state-machine-node-A");

    fireEvent.mouseDown(node, { button: 2 });
    expect(node).toHaveClass("cursor-grab");

    fireEvent.mouseDown(node, { button: 0 });
    expect(node).toHaveClass("cursor-grabbing");
  });
});

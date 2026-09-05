// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LogicGateDiagram } from "@/components/shared/LogicGateDiagram";
import type { BooleanExpression } from "@/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";

const expression: BooleanExpression = {
  type: "binary",
  operator: "and",
  left: {
    type: "binary",
    operator: "and",
    left: { type: "variable", name: "A" },
    right: { type: "variable", name: "B" },
  },
  right: { type: "not", operand: { type: "variable", name: "C" } },
};

describe("LogicGateDiagram", () => {
  it("renders binary IEC gates and wires for an expression tree", () => {
    render(
      <LogicGateDiagram
        expression={expression}
        outputName="y0"
        ariaLabel="Gate network y0"
        variables={["A", "B", "C"]}
        unavailableText="Unavailable"
        testIdPrefix="gate"
      />,
    );

    expect(screen.getByRole("img", { name: "Gate network y0" })).toBeVisible();
    expect(screen.getAllByText("&")).toHaveLength(2);
    expect(
      document.querySelectorAll('[data-testid^="gate-wire-"]'),
    ).toHaveLength(6);
  });

  it("flattens equal operators when multi-input gates are enabled", () => {
    render(
      <LogicGateDiagram
        expression={expression}
        outputName="y0"
        ariaLabel="Gate network y0"
        variables={["A", "B", "C"]}
        unavailableText="Unavailable"
        binaryGates={false}
      />,
    );

    expect(screen.getAllByText("&")).toHaveLength(1);
  });

  it("uses unique markers and renders the unavailable state", () => {
    const { container } = render(
      <>
        <LogicGateDiagram
          expression={expression}
          outputName="y0"
          ariaLabel="First network"
          variables={["A", "B", "C"]}
          unavailableText="Unavailable"
        />
        <LogicGateDiagram
          expression={expression}
          outputName="y1"
          ariaLabel="Second network"
          variables={["A", "B", "C"]}
          unavailableText="Unavailable"
        />
      </>,
    );
    const markerIds = Array.from(
      container.querySelectorAll("marker"),
      (marker) => marker.getAttribute("id"),
    );
    expect(new Set(markerIds).size).toBe(markerIds.length);

    render(
      <LogicGateDiagram
        expression={null}
        outputName="y2"
        ariaLabel="Unavailable network"
        variables={[]}
        unavailableText="Unavailable"
      />,
    );
    expect(screen.getByText("Unavailable")).toBeVisible();
  });
});

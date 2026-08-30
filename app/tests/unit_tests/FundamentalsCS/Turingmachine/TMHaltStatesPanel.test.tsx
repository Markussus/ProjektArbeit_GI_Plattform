/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TMHaltStatesPanel } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/presentation/TMHaltStatesPanel";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("TMHaltStatesPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders halt state checkboxes and handles toggling", () => {
    const onToggle = vi.fn();
    const onAddHaltState = vi.fn();

    render(
      <TMHaltStatesPanel
        states={["q0", "q1", "qS"]}
        initialState="q0"
        haltStates={["qS"]}
        onToggle={onToggle}
        onAddHaltState={onAddHaltState}
      />,
    );

    expect(screen.queryByTestId("tm-halt-state-q0")).not.toBeInTheDocument();
    expect(screen.getByTestId("tm-halt-state-q1")).toBeInTheDocument();
    expect(screen.getByTestId("tm-halt-state-qS")).toBeInTheDocument();

    const inputQ1 = screen.getByTestId(
      "tm-halt-state-input-q1",
    ) as HTMLInputElement;
    expect(inputQ1.checked).toBe(false);

    fireEvent.click(inputQ1);
    expect(onToggle).toHaveBeenCalledWith("q1", true);

    const inputQS = screen.getByTestId(
      "tm-halt-state-input-qS",
    ) as HTMLInputElement;
    expect(inputQS.checked).toBe(true);

    fireEvent.click(inputQS);
    expect(onToggle).toHaveBeenCalledWith("qS", false);
  });

  it("shows empty message when no non-initial states exist", () => {
    render(
      <TMHaltStatesPanel
        states={["q0"]}
        initialState="q0"
        haltStates={[]}
        onToggle={vi.fn()}
        onAddHaltState={vi.fn()}
      />,
    );

    expect(
      screen.getByText("turing-machine.config.haltStates.noStates"),
    ).toBeInTheDocument();
  });

  it("adds new halt state on Enter key or blur", () => {
    const onAddHaltState = vi.fn();

    render(
      <TMHaltStatesPanel
        states={["q0", "q1"]}
        initialState="q0"
        haltStates={[]}
        onToggle={vi.fn()}
        onAddHaltState={onAddHaltState}
      />,
    );

    const input = screen.getByTestId("tm-add-halt-state-input");

    // Type new state and press Enter
    fireEvent.change(input, { target: { value: "qH" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onAddHaltState).toHaveBeenCalledWith("qH");

    // Typing empty or duplicate should not trigger
    onAddHaltState.mockClear();
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.blur(input);
    expect(onAddHaltState).not.toHaveBeenCalled();

    // Typing initial state should not trigger
    fireEvent.change(input, { target: { value: "q0" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onAddHaltState).not.toHaveBeenCalled();

    // Typing existing state should not trigger
    fireEvent.change(input, { target: { value: "q1" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onAddHaltState).not.toHaveBeenCalled();

    // Key other than Enter should not commit
    fireEvent.change(input, { target: { value: "q2" } });
    fireEvent.keyDown(input, { key: "Space" });
    expect(onAddHaltState).not.toHaveBeenCalled();
  });

  it("disables inputs when disabled is true", () => {
    render(
      <TMHaltStatesPanel
        states={["q0", "q1"]}
        initialState="q0"
        haltStates={[]}
        onToggle={vi.fn()}
        onAddHaltState={vi.fn()}
        disabled={true}
      />,
    );

    expect(screen.getByTestId("tm-halt-state-input-q1")).toBeDisabled();
    expect(screen.getByTestId("tm-add-halt-state-input")).toBeDisabled();
  });
});

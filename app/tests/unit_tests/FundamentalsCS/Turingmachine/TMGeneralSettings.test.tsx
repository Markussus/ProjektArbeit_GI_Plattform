/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TMGeneralSettings } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/presentation/TMGeneralSettings";
import type { TMProgram } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgram";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("TMGeneralSettings", () => {
  afterEach(() => {
    cleanup();
  });

  const baseProgram: TMProgram = {
    states: ["q0", "q1", "qS"],
    inputAlphabet: ["0", "1"],
    tapeAlphabet: ["0", "1", "_"],
    blankSymbol: "_",
    initialState: "q0",
    haltStates: ["qS"],
    transitions: {},
    initialTape: ["1", "0", "1"],
  };

  it("renders initial tape and calls onInitialTapeChange on edit", () => {
    const onInitialTapeChange = vi.fn();
    const onInitialStateChange = vi.fn();

    render(
      <TMGeneralSettings
        program={baseProgram}
        onInitialTapeChange={onInitialTapeChange}
        onInitialStateChange={onInitialStateChange}
      />,
    );

    const input = screen.getByTestId(
      "tm-initial-tape-input",
    ) as HTMLInputElement;
    expect(input.value).toBe("101");

    fireEvent.change(input, { target: { value: "1100" } });
    expect(onInitialTapeChange).toHaveBeenCalledWith("1100");
  });

  it("renders start state dropdown excluding halt states that are not initial", () => {
    const onInitialTapeChange = vi.fn();
    const onInitialStateChange = vi.fn();

    render(
      <TMGeneralSettings
        program={baseProgram}
        onInitialTapeChange={onInitialTapeChange}
        onInitialStateChange={onInitialStateChange}
      />,
    );

    const trigger = screen.getByTestId("tm-start-state-select");
    expect(trigger).toBeInTheDocument();
  });

  it("includes halt state if it is currently the initialState", () => {
    const haltAsInitialProgram: TMProgram = {
      ...baseProgram,
      initialState: "qS",
    };

    render(
      <TMGeneralSettings
        program={haltAsInitialProgram}
        onInitialTapeChange={vi.fn()}
        onInitialStateChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("tm-start-state-select")).toBeInTheDocument();
  });

  it("disables inputs when disabled prop is true", () => {
    render(
      <TMGeneralSettings
        program={baseProgram}
        onInitialTapeChange={vi.fn()}
        onInitialStateChange={vi.fn()}
        disabled={true}
      />,
    );

    expect(screen.getByTestId("tm-initial-tape-input")).toBeDisabled();
    expect(screen.getByTestId("tm-start-state-select")).toBeDisabled();
  });
});

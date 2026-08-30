/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TMAlphabetPanel } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/presentation/TMAlphabetPanel";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("TMAlphabetPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders panel with title and symbols", () => {
    render(
      <TMAlphabetPanel
        title="Input Alphabet"
        symbols={["0", "1"]}
        testId="tm-input-alphabet"
      />,
    );

    expect(screen.getByTestId("tm-input-alphabet")).toBeInTheDocument();
    expect(screen.getByText("Input Alphabet")).toBeInTheDocument();
    expect(screen.getByTestId("tm-input-alphabet-symbol-0")).toHaveTextContent(
      "0",
    );
    expect(screen.getByTestId("tm-input-alphabet-symbol-1")).toHaveTextContent(
      "1",
    );
  });

  it("renders empty message when no symbols are present", () => {
    render(
      <TMAlphabetPanel
        title="Tape Alphabet"
        symbols={[]}
        testId="tm-tape-alphabet"
      />,
    );

    expect(
      screen.getByText("turing-machine.config.alphabets.noSymbols"),
    ).toBeInTheDocument();
  });

  it("renders without testId gracefully", () => {
    render(<TMAlphabetPanel title="Default Panel" symbols={["X"]} />);
    expect(screen.getByText("Default Panel")).toBeInTheDocument();
    expect(screen.getByText("X")).toBeInTheDocument();
  });
});

/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FractionalConverter } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/FractionalConverter.tsx";
vi.mock(
  "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel",
  async () => {
    const { mockExerciseValidationPanelForConverters } =
      await import("./converterTestSetup");
    return mockExerciseValidationPanelForConverters();
  },
);

describe("FractionalConverter", () => {
  afterEach(() => {
    cleanup();
  });

  describe("when rendering in free mode", () => {
    it("defaults to decToBin mode with value 10.5", () => {
      render(<FractionalConverter />);
      expect(
        (screen.getByTestId("ns-fractional-input") as HTMLInputElement).value,
      ).toBe("10.5");
      expect(screen.getByTestId("ns-fractional-result")).toBeTruthy();
    });

    it("converts 10.5 decimal to 1010.1 binary", () => {
      render(<FractionalConverter />);
      expect(screen.getByTestId("ns-fractional-result").textContent).toContain(
        "1010.1",
      );
    });

    it("converts 3.375 decimal to 11.011 binary", () => {
      render(<FractionalConverter />);
      const input = screen.getByTestId("ns-fractional-input");
      fireEvent.change(input, { target: { value: "3.375" } });
      expect(screen.getByTestId("ns-fractional-result").textContent).toContain(
        "11.011",
      );
    });

    it("handles negative decimal values", () => {
      render(<FractionalConverter />);
      const input = screen.getByTestId("ns-fractional-input");
      fireEvent.change(input, { target: { value: "-10.5" } });
      expect(screen.getByTestId("ns-fractional-result").textContent).toContain(
        "-1010.1",
      );
    });

    it("converts 0.0 decimal to 0.0 binary", () => {
      render(<FractionalConverter />);
      const input = screen.getByTestId("ns-fractional-input");
      fireEvent.change(input, { target: { value: "0.0" } });
      expect(screen.getByTestId("ns-fractional-result").textContent).toContain(
        "0.0",
      );
    });

    it("converts 0.5 decimal to 0.1 binary", () => {
      render(<FractionalConverter />);
      const input = screen.getByTestId("ns-fractional-input");
      fireEvent.change(input, { target: { value: "0.5" } });
      expect(screen.getByTestId("ns-fractional-result").textContent).toContain(
        "0.1",
      );
    });

    it("limits fractional binary digits to avoid huge computations", () => {
      render(<FractionalConverter />);
      const input = screen.getByTestId("ns-fractional-input");
      fireEvent.change(input, { target: { value: "0.1" } });
      const fractionalPart = screen
        .getByTestId("ns-fractional-result")
        .textContent?.split(".")[1];
      expect(fractionalPart?.length).toBeLessThanOrEqual(10);
    });

    it("does not render a result for empty, minus-only or dot-only input", () => {
      render(<FractionalConverter />);
      const input = screen.getByTestId("ns-fractional-input");

      fireEvent.change(input, { target: { value: "" } });
      expect(
        screen.queryByTestId("ns-fractional-result"),
      ).not.toBeInTheDocument();

      fireEvent.change(input, { target: { value: "-" } });
      expect(
        screen.queryByTestId("ns-fractional-result"),
      ).not.toBeInTheDocument();

      fireEvent.change(input, { target: { value: "." } });
      expect(
        screen.queryByTestId("ns-fractional-result"),
      ).not.toBeInTheDocument();
    });

    it("sanitizes multiple minus signs and dots", () => {
      render(<FractionalConverter />);
      const input = screen.getByTestId("ns-fractional-input");
      fireEvent.change(input, { target: { value: "--10..5" } });
      expect((input as HTMLInputElement).value).toBe("-10.5");
    });

    it("removes a minus sign that is not at the start", () => {
      render(<FractionalConverter />);
      const input = screen.getByTestId("ns-fractional-input");
      fireEvent.change(input, { target: { value: "10-5" } });
      expect((input as HTMLInputElement).value).toBe("105");
    });

    it("limits input length to 20 characters", () => {
      render(<FractionalConverter />);
      const input = screen.getByTestId("ns-fractional-input");
      const longValue = "1234567890123456789012345";
      fireEvent.change(input, { target: { value: longValue } });
      expect((input as HTMLInputElement).value).toHaveLength(20);
    });
  });

  describe("when switching to binToDec mode", () => {
    it("changes input to 1010.1 and result to 10.5", () => {
      render(<FractionalConverter />);
      fireEvent.click(screen.getByTestId("ns-frac-bin-to-dec-button"));
      expect(
        (screen.getByTestId("ns-fractional-input") as HTMLInputElement).value,
      ).toContain("1010.1");
      expect(screen.getByTestId("ns-fractional-result").textContent).toContain(
        "10.5",
      );
    });

    it("converts 0.1 binary to 0.5 decimal", () => {
      render(<FractionalConverter />);
      fireEvent.click(screen.getByTestId("ns-frac-bin-to-dec-button"));
      fireEvent.change(screen.getByTestId("ns-fractional-input"), {
        target: { value: "0.1" },
      });
      expect(screen.getByTestId("ns-fractional-result").textContent).toContain(
        "0.5",
      );
    });

    it("converts 0.0 binary to 0 decimal", () => {
      render(<FractionalConverter />);
      fireEvent.click(screen.getByTestId("ns-frac-bin-to-dec-button"));
      fireEvent.change(screen.getByTestId("ns-fractional-input"), {
        target: { value: "0.0" },
      });
      expect(screen.getByTestId("ns-fractional-result").textContent).toContain(
        "0",
      );
    });

    it("converts negative binary -1010.1 to -10.5 decimal", () => {
      render(<FractionalConverter />);
      fireEvent.click(screen.getByTestId("ns-frac-bin-to-dec-button"));
      fireEvent.change(screen.getByTestId("ns-fractional-input"), {
        target: { value: "-1010.1" },
      });
      expect(screen.getByTestId("ns-fractional-result").textContent).toContain(
        "-10.5",
      );
    });
  });

  describe("when in binToDec mode", () => {
    it("sanitizes non-binary characters", () => {
      render(<FractionalConverter />);
      fireEvent.click(screen.getByTestId("ns-frac-bin-to-dec-button"));
      const input = screen.getByTestId("ns-fractional-input");
      fireEvent.change(input, { target: { value: "10a1b0.1" } });
      expect((input as HTMLInputElement).value).toBe("1010.1");
    });
  });

  describe("state changes", () => {
    it("reports state changes via onChangeState", () => {
      const onChangeState = vi.fn();
      render(<FractionalConverter onChangeState={onChangeState} />);
      const input = screen.getByTestId("ns-fractional-input");
      fireEvent.change(input, { target: { value: "3.375" } });
      expect(onChangeState).toHaveBeenLastCalledWith({
        inputValue: "3.375",
        converterMode: "decToBin",
      });
    });

    it("reports mode switch via onChangeState", () => {
      const onChangeState = vi.fn();
      render(<FractionalConverter onChangeState={onChangeState} />);
      fireEvent.click(screen.getByTestId("ns-frac-bin-to-dec-button"));
      expect(onChangeState).toHaveBeenLastCalledWith({
        inputValue: "1010.1",
        converterMode: "binToDec",
      });
    });
  });

  describe("when in exercise mode", () => {
    it("disables mode toggle buttons", () => {
      render(
        <FractionalConverter
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="10.5"
        />,
      );
      expect(
        screen
          .getByTestId("ns-frac-dec-to-bin-button")
          .hasAttribute("disabled"),
      ).toBe(true);
      expect(
        screen
          .getByTestId("ns-frac-bin-to-dec-button")
          .hasAttribute("disabled"),
      ).toBe(true);
    });

    it("does not change mode or input when toggle buttons are clicked", () => {
      render(
        <FractionalConverter
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="10.5"
        />,
      );
      fireEvent.click(screen.getByTestId("ns-frac-dec-to-bin-button"));
      fireEvent.click(screen.getByTestId("ns-frac-bin-to-dec-button"));
      expect(
        (screen.getByTestId("ns-fractional-input") as HTMLInputElement).value,
      ).toBe("10.5");
    });

    it("shows the validation panel when solution is hidden", () => {
      render(
        <FractionalConverter
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="10.5"
        />,
      );
      expect(screen.getByTestId("mock-validation-panel")).toBeTruthy();
    });

    it("passes the expected binary result to validation", () => {
      render(
        <FractionalConverter
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="10.5"
        />,
      );
      expect(
        screen.getByTestId("mock-validation-expected-result").textContent,
      ).toContain("1010.1");
    });

    it("disables input when solution is hidden", () => {
      render(
        <FractionalConverter
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="10.5"
        />,
      );
      const input = screen.getByTestId("ns-fractional-input");
      expect(input.hasAttribute("disabled")).toBe(true);
    });

    it("ignores input changes while the solution is hidden", () => {
      const onChangeState = vi.fn();
      render(
        <FractionalConverter
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="10.5"
          onChangeState={onChangeState}
        />,
      );
      fireEvent.change(screen.getByTestId("ns-fractional-input"), {
        target: { value: "99.9" },
      });
      expect(
        (screen.getByTestId("ns-fractional-input") as HTMLInputElement).value,
      ).toBe("10.5");
      expect(onChangeState).not.toHaveBeenCalledWith(
        expect.objectContaining({ inputValue: "99.9" }),
      );
    });
  });

  describe("when initialized with exercise value", () => {
    it("sets the initial value", () => {
      render(<FractionalConverter initialValue="3.375" />);
      expect(
        (screen.getByTestId("ns-fractional-input") as HTMLInputElement).value,
      ).toBe("3.375");
    });
  });

  describe("when initialized with initial state", () => {
    it("uses the initial value when initialState has no inputValue", () => {
      render(
        <FractionalConverter
          initialValue="5.25"
          initialState={{ converterMode: "decToBin" }}
        />,
      );
      expect(
        (screen.getByTestId("ns-fractional-input") as HTMLInputElement).value,
      ).toBe("5.25");
      expect(screen.getByTestId("ns-fractional-result").textContent).toContain(
        "101.01",
      );
    });

    it("uses the inputValue from initialState when provided", () => {
      render(
        <FractionalConverter
          initialValue="3.375"
          initialState={{ inputValue: "0.5", converterMode: "decToBin" }}
        />,
      );
      expect(
        (screen.getByTestId("ns-fractional-input") as HTMLInputElement).value,
      ).toBe("0.5");
    });
  });
});

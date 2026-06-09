/** @vitest-environment jsdom */

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SimulatorStringTransferBox } from "@/components/shared/SimulatorStringTransferBox";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("SimulatorStringTransferBox", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("does not flash the spinner when export finishes within 10 ms", async () => {
    const codec: ISimulatorTransferCodec<string> = {
      exportValue: async () => "encoded",
      importValue: async (value) => value,
    };

    render(
      <SimulatorStringTransferBox
        value="source"
        codec={codec}
        onLoad={vi.fn()}
        testIdPrefix="transfer"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("transfer-export"));
      await Promise.resolve();
    });

    expect(
      screen.queryByTestId("transfer-export-spinner"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("transfer-input")).toHaveValue("encoded");
  });

  it("replaces the export label with a spinner after 10 ms", async () => {
    let finishExport: ((value: string) => void) | undefined;
    const codec: ISimulatorTransferCodec<string> = {
      exportValue: () =>
        new Promise<string>((resolve) => {
          finishExport = resolve;
        }),
      importValue: async (value) => value,
    };

    render(
      <SimulatorStringTransferBox
        value="source"
        codec={codec}
        onLoad={vi.fn()}
        testIdPrefix="transfer"
      />,
    );

    fireEvent.click(screen.getByTestId("transfer-export"));

    expect(screen.getByTestId("transfer-export")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(
      screen.queryByTestId("transfer-export-spinner"),
    ).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByTestId("transfer-export-spinner")).toBeInTheDocument();
    expect(
      screen.queryByText("simulation.transfer.export"),
    ).not.toBeInTheDocument();

    await act(async () => {
      finishExport?.("encoded");
      await Promise.resolve();
    });

    expect(
      screen.queryByTestId("transfer-export-spinner"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("transfer-input")).toHaveValue("encoded");
  });

  it("shows export failures instead of failing silently", async () => {
    const codec: ISimulatorTransferCodec<string> = {
      exportValue: async () => {
        throw new Error("too large");
      },
      importValue: async (value) => value,
    };

    render(
      <SimulatorStringTransferBox
        value="source"
        codec={codec}
        onLoad={vi.fn()}
        testIdPrefix="transfer"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("transfer-export"));
      await Promise.resolve();
    });

    expect(screen.getByTestId("transfer-status")).toHaveTextContent(
      "simulation.transfer.exportError",
    );
    expect(screen.getByTestId("transfer-export")).not.toBeDisabled();
  });

  it("replaces the import label with a spinner after 10 ms", async () => {
    let finishImport: ((value: string) => void) | undefined;
    const onLoad = vi.fn();
    const codec: ISimulatorTransferCodec<string> = {
      exportValue: async () => "encoded",
      importValue: () =>
        new Promise<string>((resolve) => {
          finishImport = resolve;
        }),
    };

    render(
      <SimulatorStringTransferBox
        value="source"
        codec={codec}
        onLoad={onLoad}
        testIdPrefix="transfer"
      />,
    );

    fireEvent.change(screen.getByTestId("transfer-input"), {
      target: { value: "encoded" },
    });
    fireEvent.click(screen.getByTestId("transfer-import"));

    expect(screen.getByTestId("transfer-import")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(
      screen.queryByTestId("transfer-import-spinner"),
    ).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByTestId("transfer-import-spinner")).toBeInTheDocument();
    expect(
      screen.queryByText("simulation.transfer.import"),
    ).not.toBeInTheDocument();

    await act(async () => {
      finishImport?.("decoded");
      await Promise.resolve();
    });

    expect(onLoad).toHaveBeenCalledWith("decoded");
    expect(
      screen.queryByTestId("transfer-import-spinner"),
    ).not.toBeInTheDocument();
  });
});

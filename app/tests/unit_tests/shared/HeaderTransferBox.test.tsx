/** @vitest-environment jsdom */

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeaderTransferBox } from "@/components/shared/Header/HeaderTransferBox";
import { useActiveSimulatorTransferStore } from "@/hooks/useActiveSimulatorTransfer";

const navigateSpy = vi.fn();
const resolveImportTargetSpy = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateSpy,
}));

vi.mock("@/lib/trainingCenter/trainingCenterImportNavigation", () => ({
  resolveTrainingCenterImportTarget: (value: string) =>
    resolveImportTargetSpy(value),
}));

describe("HeaderTransferBox", () => {
  const writeText = vi.fn<Clipboard["writeText"]>();

  beforeEach(() => {
    navigateSpy.mockReset();
    resolveImportTargetSpy.mockReset();
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    useActiveSimulatorTransferStore.setState({ activeTransfer: null });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    useActiveSimulatorTransferStore.setState({ activeTransfer: null });
  });

  it("disables export without an active simulator and enables it after registration", () => {
    render(<HeaderTransferBox />);
    expect(screen.getByTestId("header-transfer-export")).toBeDisabled();

    act(() => {
      useActiveSimulatorTransferStore
        .getState()
        .register(async () => "AH_exported");
    });

    expect(screen.getByTestId("header-transfer-export")).toBeEnabled();
  });

  it("copies the active simulator's current export value", async () => {
    useActiveSimulatorTransferStore
      .getState()
      .register(async () => "AH_current-state");
    render(<HeaderTransferBox />);

    fireEvent.click(screen.getByTestId("header-transfer-export"));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("AH_current-state"),
    );
    expect(screen.getByTestId("header-transfer-status")).toHaveTextContent(
      "common.simulation.transfer.copied",
    );
    expect(screen.getByTestId("header-transfer-input")).toHaveValue(
      "AH_current-state",
    );
    expect(screen.getByTestId("header-transfer-input")).toHaveAttribute(
      "readonly",
    );
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByTestId("header-transfer-import")).toBeDisabled();
  });

  it("hides the export preview after five seconds", async () => {
    vi.useFakeTimers();
    useActiveSimulatorTransferStore
      .getState()
      .register(async () => "AH_preview");
    render(<HeaderTransferBox />);

    fireEvent.click(screen.getByTestId("header-transfer-export"));
    await act(async () => Promise.resolve());
    expect(screen.getByTestId("header-transfer-input")).toHaveValue(
      "AH_preview",
    );

    act(() => vi.advanceTimersByTime(4999));
    expect(screen.getByTestId("header-transfer-input")).toHaveValue(
      "AH_preview",
    );
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId("header-transfer-input")).toHaveValue("");
    expect(screen.getByTestId("header-transfer-input")).not.toHaveAttribute(
      "readonly",
    );
    fireEvent.change(screen.getByTestId("header-transfer-input"), {
      target: { value: "AH_import-after-preview" },
    });
    expect(screen.getByTestId("header-transfer-import")).toBeEnabled();
  });

  it("keeps the preview visible when clipboard access fails", async () => {
    writeText.mockRejectedValueOnce(new Error("permission denied"));
    useActiveSimulatorTransferStore
      .getState()
      .register(async () => "AH_manual-copy");
    render(<HeaderTransferBox />);

    fireEvent.click(screen.getByTestId("header-transfer-export"));

    await waitFor(() =>
      expect(screen.getByTestId("header-transfer-status")).toHaveTextContent(
        "common.simulation.transfer.clipboardError",
      ),
    );
    expect(screen.getByTestId("header-transfer-input")).toHaveValue(
      "AH_manual-copy",
    );
  });

  it("restarts the five-second timer for a later export", async () => {
    vi.useFakeTimers();
    useActiveSimulatorTransferStore.getState().register(async () => "AH_first");
    render(<HeaderTransferBox />);

    fireEvent.click(screen.getByTestId("header-transfer-export"));
    await act(async () => Promise.resolve());
    act(() => vi.advanceTimersByTime(2000));

    act(() => {
      useActiveSimulatorTransferStore
        .getState()
        .register(async () => "AH_second");
    });
    fireEvent.click(screen.getByTestId("header-transfer-export"));
    await act(async () => Promise.resolve());
    expect(screen.getByTestId("header-transfer-input")).toHaveValue(
      "AH_second",
    );

    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByTestId("header-transfer-input")).toHaveValue(
      "AH_second",
    );
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByTestId("header-transfer-input")).toHaveValue("");
  });

  it("keeps import disabled for blank input and clears it after successful routing", () => {
    resolveImportTargetSpy.mockReturnValue({
      path: "/programming-1/java-programming",
      storageValue: "AH_payload",
    });
    render(<HeaderTransferBox />);

    const input = screen.getByTestId("header-transfer-input");
    const importButton = screen.getByTestId("header-transfer-import");
    expect(importButton).toBeDisabled();

    fireEvent.change(input, { target: { value: " AH_payload " } });
    expect(importButton).toBeEnabled();
    fireEvent.click(importButton);

    expect(resolveImportTargetSpy).toHaveBeenCalledWith("AH_payload");
    expect(navigateSpy).toHaveBeenCalledWith(
      "/programming-1/java-programming",
      {
        state: {
          trainingCenterImport: { storageValue: "AH_payload" },
        },
      },
    );
    expect(input).toHaveValue("");
  });
});

/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { InfoPage } from "@/pages/Info/InfoPage";
import { useFontStore } from "@/store/fontStore";
import {
  applyFont,
  getStoredFont,
  DEFAULT_FONT,
  FONT_STORAGE_KEY,
} from "@/lib/font";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("Font toggle and typography configuration", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: storage,
    });
    vi.stubGlobal("localStorage", storage);
    useFontStore.setState({ font: "inter" });
    document.documentElement.removeAttribute("data-font");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("should have inter as default font", () => {
    expect(DEFAULT_FONT).toBe("inter");
    expect(getStoredFont()).toBe("inter");
  });

  it("should get and set font correctly via helper functions", () => {
    applyFont("geist");
    expect(document.documentElement.dataset.font).toBe("geist");

    applyFont("inter");
    expect(document.documentElement.dataset.font).toBe("inter");
  });

  it("should render font dropdown select on InfoPage and allow switching font", () => {
    render(
      <MemoryRouter>
        <InfoPage />
      </MemoryRouter>,
    );

    const triggerBtn = screen.getByTestId("font-select-trigger");
    expect(triggerBtn).toBeInTheDocument();
    expect(useFontStore.getState().font).toBe("inter");

    // Open dropdown
    fireEvent.click(triggerBtn);

    const geistOption = screen.getByTestId("font-select-option-geist");
    expect(geistOption).toBeInTheDocument();

    // Select Geist
    fireEvent.click(geistOption);
    expect(useFontStore.getState().font).toBe("geist");
    expect(document.documentElement.dataset.font).toBe("geist");

    // Open dropdown again and select Inter
    fireEvent.click(triggerBtn);
    const interOption = screen.getByTestId("font-select-option-inter");
    fireEvent.click(interOption);
    expect(useFontStore.getState().font).toBe("inter");
    expect(document.documentElement.dataset.font).toBe("inter");
  });

  it("should persist font preference in localStorage", () => {
    window.localStorage.setItem(
      FONT_STORAGE_KEY,
      JSON.stringify({ state: { font: "geist" } }),
    );
    expect(getStoredFont()).toBe("geist");
  });
});

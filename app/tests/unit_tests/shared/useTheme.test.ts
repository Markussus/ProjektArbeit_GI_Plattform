/** @vitest-environment jsdom */

import { vi } from "vitest";

const memoryStorage = vi.hoisted(() => {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  return storage;
});

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useTheme } from "@/hooks/useTheme";
import { useThemeStore } from "@/store/themeStore";

describe("useTheme", () => {
  beforeEach(() => {
    memoryStorage.clear();
    document.documentElement.classList.remove("dark");
    act(() => {
      useThemeStore.setState({ theme: "light" });
    });
  });

  afterEach(() => {
    act(() => {
      useThemeStore.setState({ theme: "light" });
    });
    memoryStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("returns initial theme and resolvedTheme", () => {
    const { result, unmount } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
    expect(result.current.resolvedTheme).toBe("light");
    unmount();
  });

  it("updates theme via setTheme and toggleTheme", () => {
    const { result, unmount } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme("dark");
    });
    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe("light");
    expect(result.current.resolvedTheme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    unmount();
  });

  it("handles system theme and watches for system theme changes", () => {
    let changeListener: ((e: MediaQueryListEvent) => void) | null = null;
    const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(
        (_event: string, callback: EventListenerOrEventListenerObject) => {
          changeListener = callback as (e: MediaQueryListEvent) => void;
        },
      ),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = matchMediaMock;

    const { result, unmount } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme("system");
    });
    expect(result.current.theme).toBe("system");

    if (changeListener) {
      act(() => {
        (changeListener as (e: MediaQueryListEvent) => void)({
          matches: true,
        } as MediaQueryListEvent);
      });
    }
    unmount();
  });
});

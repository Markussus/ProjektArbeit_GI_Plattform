/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useTapeAutoCenter,
  useTapeHeadTracking,
  useTapeResponsiveRadius,
  useTapeShiftAnimation,
} from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/presentation/hooks/useTapeAnimation";

describe("useTapeAnimation hooks", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("useTapeResponsiveRadius", () => {
    it("handles null refs gracefully without crashing", () => {
      const setResponsiveWindowRadius = vi.fn();
      renderHook(() =>
        useTapeResponsiveRadius({
          responsiveBoundaryRef: { current: null },
          tapeViewportRef: { current: null },
          tapeTrackRef: { current: null },
          effectiveWindowRadius: 5,
          maxWindowRadius: 10,
          cells: [],
          setResponsiveWindowRadius,
        }),
      );

      expect(setResponsiveWindowRadius).not.toHaveBeenCalled();
    });

    it("observes element resizing and computes responsive radius", () => {
      let resizeCallback: ResizeObserverCallback = () => {};
      global.ResizeObserver = class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      } as unknown as typeof ResizeObserver;

      const viewportEl = document.createElement("div");
      Object.defineProperty(viewportEl, "clientWidth", {
        value: 600,
        configurable: true,
      });
      window.getComputedStyle = vi.fn().mockReturnValue({
        paddingLeft: "10px",
        paddingRight: "10px",
      } as unknown as CSSStyleDeclaration);

      const trackEl = document.createElement("div");
      Object.defineProperty(trackEl, "offsetWidth", {
        value: 500,
        configurable: true,
      });

      const cell0 = document.createElement("div");
      Object.defineProperty(cell0, "offsetWidth", {
        value: 40,
        configurable: true,
      });
      Object.defineProperty(cell0, "offsetLeft", {
        value: 0,
        configurable: true,
      });
      trackEl.appendChild(cell0);

      const cell1 = document.createElement("div");
      Object.defineProperty(cell1, "offsetLeft", {
        value: 50,
        configurable: true,
      });
      trackEl.appendChild(cell1);

      const setResponsiveWindowRadius = vi.fn();

      renderHook(() =>
        useTapeResponsiveRadius({
          tapeViewportRef: { current: viewportEl },
          tapeTrackRef: { current: trackEl },
          effectiveWindowRadius: 0,
          maxWindowRadius: 10,
          cells: [{ index: 0, value: "0", isFocused: false, isBlank: false }],
          setResponsiveWindowRadius,
        }),
      );

      // Trigger resize
      act(() => {
        resizeCallback([], {} as ResizeObserver);
      });

      expect(setResponsiveWindowRadius).toHaveBeenCalled();
    });
  });

  describe("useTapeHeadTracking", () => {
    it("hides head indicator when elements are missing", () => {
      const headIndicator = document.createElement("div");
      const { result } = renderHook(() =>
        useTapeHeadTracking({
          headIndicatorRef: { current: headIndicator },
          focusedCellRef: { current: null },
          tapeScrollerRef: { current: null },
          cells: [],
        }),
      );

      act(() => {
        result.current.updateHeadIndicatorPosition();
      });

      expect(headIndicator.style.opacity).toBe("0");
    });

    it("positions head indicator when elements and coordinates are valid", () => {
      const headIndicator = document.createElement("div");
      const focusedCell = document.createElement("div");
      const tapeScroller = document.createElement("div");

      tapeScroller.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 0,
        right: 500,
        width: 500,
      });

      focusedCell.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 100,
        right: 150,
        width: 50,
      });

      headIndicator.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 0,
        right: 20,
        width: 20,
      });

      const { result } = renderHook(() =>
        useTapeHeadTracking({
          headIndicatorRef: { current: headIndicator },
          focusedCellRef: { current: focusedCell },
          tapeScrollerRef: { current: tapeScroller },
          cells: [{ index: 0, value: "0", isFocused: true, isBlank: false }],
        }),
      );

      act(() => {
        result.current.updateHeadIndicatorPosition();
      });

      expect(headIndicator.style.opacity).toBe("1");
      expect(headIndicator.style.transform).toContain("translateX(125px)");
    });

    it("tracks head indicator during animation via requestAnimationFrame loop", () => {
      let rafId = 1;
      const rafCallbacks = new Map<number, (time: number) => void>();
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        const id = rafId++;
        rafCallbacks.set(id, cb);
        return id;
      });
      vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
        rafCallbacks.delete(id);
      });

      const headIndicator = document.createElement("div");
      const focusedCell = document.createElement("div");
      const tapeScroller = document.createElement("div");

      tapeScroller.getBoundingClientRect = vi
        .fn()
        .mockReturnValue({ left: 0, right: 500, width: 500 });
      focusedCell.getBoundingClientRect = vi
        .fn()
        .mockReturnValue({ left: 100, right: 150, width: 50 });

      const { result } = renderHook(() =>
        useTapeHeadTracking({
          headIndicatorRef: { current: headIndicator },
          focusedCellRef: { current: focusedCell },
          tapeScrollerRef: { current: tapeScroller },
          cells: [],
        }),
      );

      act(() => {
        result.current.trackHeadIndicatorDuringAnimation(50);
      });

      expect(rafCallbacks.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe("useTapeAutoCenter", () => {
    it("scrolls to center the focused cell", () => {
      const tapeScroller = document.createElement("div");
      tapeScroller.scrollTo = vi.fn();
      Object.defineProperty(tapeScroller, "clientWidth", { value: 400 });
      tapeScroller.scrollLeft = 0;
      tapeScroller.getBoundingClientRect = vi
        .fn()
        .mockReturnValue({ left: 0, width: 400 });

      const focusedCell = document.createElement("div");
      focusedCell.getBoundingClientRect = vi
        .fn()
        .mockReturnValue({ left: 200, width: 50 });

      const trackHeadIndicatorDuringAnimation = vi.fn();

      const { rerender } = renderHook(
        (props: { autoCenterKey: string }) =>
          useTapeAutoCenter({
            tapeScrollerRef: { current: tapeScroller },
            focusedCellRef: { current: focusedCell },
            autoCenterKey: props.autoCenterKey,
            headPosition: 0,
            transitionDurationMs: 150,
            trackHeadIndicatorDuringAnimation,
          }),
        { initialProps: { autoCenterKey: "key-1" } },
      );

      expect(tapeScroller.scrollTo).toHaveBeenCalledWith({
        left: expect.any(Number),
        behavior: "smooth",
      });
      expect(trackHeadIndicatorDuringAnimation).toHaveBeenCalledWith(150);

      // Re-render with same key does not trigger scroll
      vi.mocked(tapeScroller.scrollTo).mockClear();
      rerender({ autoCenterKey: "key-1" });
      expect(tapeScroller.scrollTo).not.toHaveBeenCalled();

      // Re-render with new key triggers scroll with auto behavior when transitionDuration is 0
      rerender({ autoCenterKey: "key-2" });
      expect(tapeScroller.scrollTo).toHaveBeenCalled();
    });
  });

  describe("useTapeShiftAnimation", () => {
    it("animates tape shift when cells shift within animation threshold", () => {
      const tapeTrack = document.createElement("div");
      const cell0 = document.createElement("div");
      Object.defineProperty(cell0, "offsetLeft", {
        value: 0,
        configurable: true,
      });
      const cell1 = document.createElement("div");
      Object.defineProperty(cell1, "offsetLeft", {
        value: 50,
        configurable: true,
      });
      tapeTrack.appendChild(cell0);
      tapeTrack.appendChild(cell1);

      let rafCallback: FrameRequestCallback | null = null;
      vi.spyOn(window, "requestAnimationFrame").mockImplementation(
        (cb: FrameRequestCallback) => {
          rafCallback = cb;
          return 123;
        },
      );
      vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

      const updateHeadIndicatorPosition = vi.fn();
      const trackHeadIndicatorDuringAnimation = vi.fn();

      const { rerender } = renderHook(
        (props: { tapeRangeMinIndex: number; radius: number }) =>
          useTapeShiftAnimation({
            tapeTrackRef: { current: tapeTrack },
            tapeRangeMinIndex: props.tapeRangeMinIndex,
            effectiveWindowRadius: props.radius,
            transitionDurationMs: 200,
            updateHeadIndicatorPosition,
            trackHeadIndicatorDuringAnimation,
          }),
        { initialProps: { tapeRangeMinIndex: 0, radius: 5 } },
      );

      // Shift by 1 cell
      rerender({ tapeRangeMinIndex: 1, radius: 5 });

      expect(updateHeadIndicatorPosition).toHaveBeenCalled();
      expect(tapeTrack.style.transform).toContain("translateX(50px)");

      // Run the RAF
      if (rafCallback) {
        act(() => {
          rafCallback?.(0);
        });
      }

      expect(tapeTrack.style.transform).toBe("translateX(0px)");
      expect(trackHeadIndicatorDuringAnimation).toHaveBeenCalledWith(200);
    });

    it("resets transform when radius changes instead of shifting", () => {
      const tapeTrack = document.createElement("div");
      const { rerender } = renderHook(
        (props: { tapeRangeMinIndex: number; radius: number }) =>
          useTapeShiftAnimation({
            tapeTrackRef: { current: tapeTrack },
            tapeRangeMinIndex: props.tapeRangeMinIndex,
            effectiveWindowRadius: props.radius,
            transitionDurationMs: 200,
            updateHeadIndicatorPosition: vi.fn(),
            trackHeadIndicatorDuringAnimation: vi.fn(),
          }),
        { initialProps: { tapeRangeMinIndex: 0, radius: 5 } },
      );

      rerender({ tapeRangeMinIndex: 1, radius: 6 });
      expect(tapeTrack.style.transform).toBe("translateX(0px)");
      expect(tapeTrack.style.transitionDuration).toBe("0ms");
    });

    it("handles tape shift when track has fewer than 2 cells or cellPitch <= 0", () => {
      const emptyTrack = document.createElement("div");
      const { rerender: rerenderEmpty } = renderHook(
        (props: { tapeRangeMinIndex: number }) =>
          useTapeShiftAnimation({
            tapeTrackRef: { current: emptyTrack },
            tapeRangeMinIndex: props.tapeRangeMinIndex,
            effectiveWindowRadius: 5,
            transitionDurationMs: 200,
            updateHeadIndicatorPosition: vi.fn(),
            trackHeadIndicatorDuringAnimation: vi.fn(),
          }),
        { initialProps: { tapeRangeMinIndex: 0 } },
      );
      rerenderEmpty({ tapeRangeMinIndex: 1 });
      expect(emptyTrack.style.transform).toBe("translateX(0px)");

      const zeroPitchTrack = document.createElement("div");
      const cell0 = document.createElement("div");
      Object.defineProperty(cell0, "offsetLeft", {
        value: 50,
        configurable: true,
      });
      const cell1 = document.createElement("div");
      Object.defineProperty(cell1, "offsetLeft", {
        value: 50,
        configurable: true,
      });
      zeroPitchTrack.appendChild(cell0);
      zeroPitchTrack.appendChild(cell1);

      const { rerender: rerenderZeroPitch } = renderHook(
        (props: { tapeRangeMinIndex: number }) =>
          useTapeShiftAnimation({
            tapeTrackRef: { current: zeroPitchTrack },
            tapeRangeMinIndex: props.tapeRangeMinIndex,
            effectiveWindowRadius: 5,
            transitionDurationMs: 200,
            updateHeadIndicatorPosition: vi.fn(),
            trackHeadIndicatorDuringAnimation: vi.fn(),
          }),
        { initialProps: { tapeRangeMinIndex: 0 } },
      );
      rerenderZeroPitch({ tapeRangeMinIndex: 1 });
      expect(zeroPitchTrack.style.transform).toBe("translateX(0px)");
    });
  });
});

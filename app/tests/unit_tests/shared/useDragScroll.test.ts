/** @vitest-environment jsdom */

import { act, fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDragScroll } from "@/hooks/useDragScroll";

describe("useDragScroll", () => {
  it("initializes with isDragging false", () => {
    const { result } = renderHook(() => useDragScroll<HTMLDivElement>());
    expect(result.current.isDragging).toBe(false);
  });

  it("handles dragging lifecycle on mouse down, move, and up", () => {
    const { result } = renderHook(() => useDragScroll<HTMLDivElement>());

    const container = document.createElement("div");
    Object.defineProperty(container, "clientWidth", { value: 200 });
    Object.defineProperty(container, "clientHeight", { value: 200 });
    Object.defineProperty(container, "scrollWidth", { value: 500 });
    Object.defineProperty(container, "scrollHeight", { value: 500 });
    container.scrollLeft = 50;
    container.scrollTop = 50;
    container.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 200,
      width: 200,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    act(() => {
      result.current.setElementRef(container);
    });

    // Valid left-click drag start
    act(() => {
      result.current.onMouseDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        target: container,
      } as unknown as React.MouseEvent<HTMLDivElement>);
    });
    expect(result.current.isDragging).toBe(true);

    // Mouse move on window
    act(() => {
      fireEvent.mouseMove(window, { clientX: 80, clientY: 70 });
    });
    // drag delta = (80 - 100) = -20 -> scrollLeft = 50 - (-20) = 70
    // drag delta = (70 - 100) = -30 -> scrollTop = 50 - (-30) = 80
    expect(container.scrollLeft).toBe(70);
    expect(container.scrollTop).toBe(80);

    // Mouse up ends dragging
    act(() => {
      fireEvent.mouseUp(window);
    });
    expect(result.current.isDragging).toBe(false);
  });

  it("ignores non-left-click or interactive children", () => {
    const { result } = renderHook(() => useDragScroll<HTMLDivElement>());

    const container = document.createElement("div");
    const button = document.createElement("button");
    container.appendChild(button);
    act(() => {
      result.current.setElementRef(container);
    });

    // Right click
    act(() => {
      result.current.onMouseDown({
        button: 2,
        clientX: 50,
        clientY: 50,
        target: container,
      } as unknown as React.MouseEvent<HTMLDivElement>);
    });
    expect(result.current.isDragging).toBe(false);

    // Clicking a button inside container
    act(() => {
      result.current.onMouseDown({
        button: 0,
        clientX: 50,
        clientY: 50,
        target: button,
      } as unknown as React.MouseEvent<HTMLDivElement>);
    });
    expect(result.current.isDragging).toBe(false);
  });

  it("ignores clicks directly on scrollbars", () => {
    const { result } = renderHook(() => useDragScroll<HTMLDivElement>());
    const container = document.createElement("div");
    Object.defineProperty(container, "clientWidth", { value: 100 });
    Object.defineProperty(container, "clientHeight", { value: 100 });
    Object.defineProperty(container, "scrollWidth", { value: 200 });
    Object.defineProperty(container, "scrollHeight", { value: 200 });
    container.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    act(() => {
      result.current.setElementRef(container);
    });

    // Click near bottom edge (horizontal scrollbar area, bottom - 16 = 84)
    act(() => {
      result.current.onMouseDown({
        button: 0,
        clientX: 50,
        clientY: 95,
        target: container,
      } as unknown as React.MouseEvent<HTMLDivElement>);
    });
    expect(result.current.isDragging).toBe(false);
  });

  it("calls scrollToEnd and scrollElementIntoView", () => {
    const { result } = renderHook(() => useDragScroll<HTMLDivElement>());
    const container = document.createElement("div");
    container.scrollTo = vi.fn();
    Object.defineProperty(container, "scrollWidth", { value: 800 });
    container.scrollLeft = 100;
    container.scrollTop = 100;
    container.getBoundingClientRect = () => ({
      left: 50,
      top: 50,
      right: 250,
      bottom: 250,
      width: 200,
      height: 200,
      x: 50,
      y: 50,
      toJSON: () => {},
    });

    act(() => {
      result.current.setElementRef(container);
    });

    // scrollToEnd
    act(() => {
      result.current.scrollToEnd();
    });
    expect(container.scrollTo).toHaveBeenCalledWith({
      left: 800,
      behavior: "smooth",
    });

    // scrollElementIntoView (element to the right and below)
    const target = document.createElement("div");
    target.getBoundingClientRect = () => ({
      left: 260,
      top: 270,
      right: 310,
      bottom: 320,
      width: 50,
      height: 50,
      x: 260,
      y: 270,
      toJSON: () => {},
    });

    act(() => {
      result.current.scrollElementIntoView(target);
    });
    expect(container.scrollLeft).toBe(160); // 100 + (310 - 250)
    expect(container.scrollTop).toBe(170); // 100 + (320 - 250)

    // Target to left and above
    target.getBoundingClientRect = () => ({
      left: 20,
      top: 30,
      right: 40,
      bottom: 45,
      width: 20,
      height: 15,
      x: 20,
      y: 30,
      toJSON: () => {},
    });

    act(() => {
      result.current.scrollElementIntoView(target);
    });
    expect(container.scrollLeft).toBe(130); // 160 - (50 - 20)
    expect(container.scrollTop).toBe(150); // 170 - (50 - 30)
  });
});

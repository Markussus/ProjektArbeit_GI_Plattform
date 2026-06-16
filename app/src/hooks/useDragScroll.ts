import { useCallback, useEffect, useRef, useState } from "react";

export interface UseDragScrollResult<TElement extends HTMLElement> {
  setElementRef: (element: TElement | null) => void;
  isDragging: boolean;
  onMouseDown: (event: React.MouseEvent<TElement>) => void;
  scrollToEnd: () => void;
  scrollElementIntoView: (element: HTMLElement | null) => void;
}

export function useDragScroll<
  TElement extends HTMLElement,
>(): UseDragScrollResult<TElement> {
  const ref = useRef<TElement | null>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMove = (event: MouseEvent) => {
      const element = ref.current;
      const drag = dragRef.current;
      if (!element || !drag) {
        return;
      }
      element.scrollLeft = drag.scrollLeft - (event.clientX - drag.x);
      element.scrollTop = drag.scrollTop - (event.clientY - drag.y);
    };
    const handleUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging]);

  const setElementRef = useCallback((element: TElement | null) => {
    ref.current = element;
  }, []);

  const scrollToEnd = useCallback(() => {
    const element = ref.current;
    if (element) {
      element.scrollTo({ left: element.scrollWidth, behavior: "smooth" });
    }
  }, []);

  const scrollElementIntoView = useCallback((target: HTMLElement | null) => {
    const element = ref.current;
    if (!element || !target) {
      return;
    }
    const containerRect = element.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    if (targetRect.left < containerRect.left) {
      element.scrollLeft -= containerRect.left - targetRect.left;
    } else if (targetRect.right > containerRect.right) {
      element.scrollLeft += targetRect.right - containerRect.right;
    }
    if (targetRect.top < containerRect.top) {
      element.scrollTop -= containerRect.top - targetRect.top;
    } else if (targetRect.bottom > containerRect.bottom) {
      element.scrollTop += targetRect.bottom - containerRect.bottom;
    }
  }, []);

  return {
    setElementRef,
    isDragging,
    onMouseDown(event: React.MouseEvent<TElement>) {
      if (
        event.button !== 0 ||
        (event.target as Element).closest(
          "button, input, select, textarea, [role='option']",
        )
      ) {
        return;
      }
      const element = ref.current;
      if (!element) {
        return;
      }
      dragRef.current = {
        x: event.clientX,
        y: event.clientY,
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop,
      };
      setIsDragging(true);
    },
    scrollToEnd,
    scrollElementIntoView,
  };
}

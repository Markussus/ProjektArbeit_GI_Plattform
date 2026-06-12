import { useCallback, useEffect, useRef, useState } from "react";

export interface UseDragScrollResult<TElement extends HTMLElement> {
  setElementRef: (element: TElement | null) => void;
  isDragging: boolean;
  onMouseDown: (event: React.MouseEvent<TElement>) => void;
  scrollToEnd: () => void;
}

export function useDragScroll<
  TElement extends HTMLElement,
>(): UseDragScrollResult<TElement> {
  const ref = useRef<TElement | null>(null);
  const dragRef = useRef<{ x: number; scrollLeft: number } | null>(null);
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
      dragRef.current = { x: event.clientX, scrollLeft: element.scrollLeft };
      setIsDragging(true);
    },
    scrollToEnd,
  };
}

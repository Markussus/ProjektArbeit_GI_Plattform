import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface SvgViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UseSvgZoomPanResult {
  viewBox: SvgViewBox;
  scale: number;
  isPanning: boolean;
  setSvgRef: (element: SVGSVGElement | null) => void;
  onMouseDown: (event: React.MouseEvent<SVGSVGElement>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  ensurePointVisible: (x: number, y: number, padding?: number) => void;
  reset: () => void;
}

export function useSvgZoomPan(
  contentWidth: number,
  contentHeight: number,
): UseSvgZoomPanResult {
  const initial = useMemo(
    () => ({ x: 0, y: 0, width: contentWidth, height: contentHeight }),
    [contentHeight, contentWidth],
  );
  const [viewBox, setViewBox] = useState(initial);
  const [previousInitial, setPreviousInitial] = useState(initial);
  const [isPanning, setIsPanning] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const panRef = useRef<{
    start: DOMPoint;
    screenToSvg: DOMMatrix;
    viewBox: typeof initial;
  } | null>(null);

  if (previousInitial !== initial) {
    setPreviousInitial(initial);
    setViewBox(initial);
  }

  const zoom = useCallback(
    (factor: number, anchorX: number, anchorY: number) => {
      setViewBox((current) => {
        const minimumWidth = contentWidth / 6;
        const maximumWidth = contentWidth * 4;
        const width = Math.min(
          maximumWidth,
          Math.max(minimumWidth, current.width / factor),
        );
        const ratio = width / current.width;
        return {
          x: anchorX - (anchorX - current.x) * ratio,
          y: anchorY - (anchorY - current.y) * ratio,
          width,
          height: width * (current.height / current.width),
        };
      });
    },
    [contentWidth],
  );

  const ensurePointVisible = useCallback(
    (x: number, y: number, padding = 0) => {
      setViewBox((current) => {
        const horizontalPadding = Math.min(padding, current.width / 2);
        const verticalPadding = Math.min(padding, current.height / 2);
        let nextX = current.x;
        let nextY = current.y;

        if (x < current.x + horizontalPadding) {
          nextX = x - horizontalPadding;
        } else if (x > current.x + current.width - horizontalPadding) {
          nextX = x + horizontalPadding - current.width;
        }

        if (y < current.y + verticalPadding) {
          nextY = y - verticalPadding;
        } else if (y > current.y + current.height - verticalPadding) {
          nextY = y + verticalPadding - current.height;
        }

        if (nextX === current.x && nextY === current.y) {
          return current;
        }
        return { ...current, x: nextX, y: nextY };
      });
    },
    [],
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const matrix = svg.getScreenCTM();
      if (!matrix) {
        return;
      }
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const transformed = point.matrixTransform(matrix.inverse());
      zoom(event.deltaY < 0 ? 1.12 : 1 / 1.12, transformed.x, transformed.y);
    };
    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, [zoom]);

  useEffect(() => {
    if (!isPanning) {
      return;
    }
    const handleMove = (event: MouseEvent) => {
      const svg = svgRef.current;
      const pan = panRef.current;
      if (!svg || !pan) {
        return;
      }
      const current = new DOMPoint(event.clientX, event.clientY).matrixTransform(
        pan.screenToSvg,
      );
      setViewBox({
        ...pan.viewBox,
        x: pan.viewBox.x - (current.x - pan.start.x),
        y: pan.viewBox.y - (current.y - pan.start.y),
      });
    };
    const handleUp = () => {
      panRef.current = null;
      setIsPanning(false);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isPanning]);

  return {
    viewBox,
    scale: contentWidth / viewBox.width,
    isPanning,
    setSvgRef: (element: SVGSVGElement | null) => {
      svgRef.current = element;
    },
    onMouseDown(event: React.MouseEvent<SVGSVGElement>) {
      if (event.button !== 0 || (event.target as Element).closest("button")) {
        return;
      }
      const matrix = svgRef.current?.getScreenCTM();
      if (!matrix) {
        return;
      }
      const screenToSvg = matrix.inverse();
      panRef.current = {
        start: new DOMPoint(event.clientX, event.clientY).matrixTransform(
          screenToSvg,
        ),
        screenToSvg,
        viewBox,
      };
      setIsPanning(true);
    },
    zoomIn: () =>
      zoom(1.3, viewBox.x + viewBox.width / 2, viewBox.y + viewBox.height / 2),
    zoomOut: () =>
      zoom(
        1 / 1.3,
        viewBox.x + viewBox.width / 2,
        viewBox.y + viewBox.height / 2,
      ),
    ensurePointVisible,
    reset: () => setViewBox(initial),
  };
}

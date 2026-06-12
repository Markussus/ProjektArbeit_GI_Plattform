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
    x: number;
    y: number;
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
      const rect = svg.getBoundingClientRect();
      setViewBox({
        ...pan.viewBox,
        x:
          pan.viewBox.x -
          (event.clientX - pan.x) * (pan.viewBox.width / rect.width),
        y:
          pan.viewBox.y -
          (event.clientY - pan.y) * (pan.viewBox.height / rect.height),
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
      panRef.current = {
        x: event.clientX,
        y: event.clientY,
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
    reset: () => setViewBox(initial),
  };
}

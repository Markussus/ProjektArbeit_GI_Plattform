import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UseGraphZoomPanResult {
  viewBox: ViewBox;
  /** Display scale: contentWidth / viewBox.width. >1 = zoomed in. */
  scale: number;
  setSvgRef: (el: SVGSVGElement | null) => void;
  onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
  isPanning: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 6;
const WHEEL_ZOOM_FACTOR = 1.12;
const BUTTON_ZOOM_FACTOR = 1.3;

export function useGraphZoomPan(
  contentWidth: number,
  contentHeight: number,
): UseGraphZoomPanResult {
  const initialViewBox = useMemo<ViewBox>(
    () => ({ x: 0, y: 0, width: contentWidth, height: contentHeight }),
    [contentWidth, contentHeight],
  );

  const [viewBox, setViewBox] = useState<ViewBox>(initialViewBox);
  const [lastInitial, setLastInitial] = useState<ViewBox>(initialViewBox);
  const [isPanning, setIsPanning] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const panRef = useRef<{
    startClientX: number;
    startClientY: number;
    startVb: ViewBox;
  } | null>(null);

  // Reset viewBox when content dimensions change (e.g. a new program is loaded).
  // Following React's "store info from previous renders" pattern instead of an
  // effect, since the reset is derived from props.
  if (lastInitial !== initialViewBox) {
    setLastInitial(initialViewBox);
    setViewBox(initialViewBox);
  }

  const clampViewBoxWidth = useCallback(
    (width: number) => {
      const minW = contentWidth / MAX_SCALE;
      const maxW = contentWidth / MIN_SCALE;
      return Math.min(Math.max(width, minW), maxW);
    },
    [contentWidth],
  );

  const cursorViewPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const inv = ctm.inverse();
    const t = pt.matrixTransform(inv);
    return { x: t.x, y: t.y };
  }, []);

  const zoomAtPoint = useCallback(
    (factor: number, anchorX: number, anchorY: number) => {
      setViewBox((vb) => {
        const newWidth = clampViewBoxWidth(vb.width / factor);
        const aspect = vb.height / vb.width;
        const newHeight = newWidth * aspect;
        const ratio = newWidth / vb.width;
        const newX = anchorX - (anchorX - vb.x) * ratio;
        const newY = anchorY - (anchorY - vb.y) * ratio;
        return { x: newX, y: newY, width: newWidth, height: newHeight };
      });
    },
    [clampViewBoxWidth],
  );

  // Non-passive wheel listener — needed because React attaches wheel as passive,
  // so e.preventDefault() in onWheel doesn't stop page scroll.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const point = cursorViewPoint(e.clientX, e.clientY);
      if (!point) return;
      const factor = e.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR;
      zoomAtPoint(factor, point.x, point.y);
    };

    svg.addEventListener("wheel", handler, { passive: false });
    return () => {
      svg.removeEventListener("wheel", handler);
    };
  }, [cursorViewPoint, zoomAtPoint]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      const target = e.target as Element;
      // Don't start a pan when clicking on interactive controls inside the SVG.
      if (target.closest("[data-no-pan]")) return;
      panRef.current = {
        startClientX: e.clientX,
        startClientY: e.clientY,
        startVb: viewBox,
      };
      setIsPanning(true);
    },
    [viewBox],
  );

  // Mouse move/up tracked at window level so the pan keeps working even if
  // the cursor leaves the SVG mid-drag.
  useEffect(() => {
    if (!isPanning) return;

    const onMove = (e: MouseEvent) => {
      const start = panRef.current;
      const svg = svgRef.current;
      if (!start || !svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = start.startVb.width / rect.width;
      const scaleY = start.startVb.height / rect.height;
      const dx = (e.clientX - start.startClientX) * scaleX;
      const dy = (e.clientY - start.startClientY) * scaleY;
      setViewBox({
        x: start.startVb.x - dx,
        y: start.startVb.y - dy,
        width: start.startVb.width,
        height: start.startVb.height,
      });
    };

    const onUp = () => {
      panRef.current = null;
      setIsPanning(false);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isPanning]);

  const setSvgRef = useCallback((el: SVGSVGElement | null) => {
    svgRef.current = el;
  }, []);

  const zoomIn = useCallback(() => {
    const cx = viewBox.x + viewBox.width / 2;
    const cy = viewBox.y + viewBox.height / 2;
    zoomAtPoint(BUTTON_ZOOM_FACTOR, cx, cy);
  }, [viewBox, zoomAtPoint]);

  const zoomOut = useCallback(() => {
    const cx = viewBox.x + viewBox.width / 2;
    const cy = viewBox.y + viewBox.height / 2;
    zoomAtPoint(1 / BUTTON_ZOOM_FACTOR, cx, cy);
  }, [viewBox, zoomAtPoint]);

  const reset = useCallback(() => {
    setViewBox(initialViewBox);
  }, [initialViewBox]);

  const scale = contentWidth / viewBox.width;

  return {
    viewBox,
    scale,
    setSvgRef,
    onMouseDown,
    isPanning,
    zoomIn,
    zoomOut,
    reset,
  };
}

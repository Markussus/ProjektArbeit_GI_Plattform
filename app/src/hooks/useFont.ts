import { useEffect } from "react";
import { useFontStore } from "@/store/fontStore";
import { applyFont, type AppFont } from "@/lib/font";

export function useFont() {
  const font = useFontStore((state) => state.font);
  const setFontState = useFontStore((state) => state.setFont);

  useEffect(() => {
    applyFont(font);
  }, [font]);

  const setFont = (nextFont: AppFont) => {
    applyFont(nextFont);
    setFontState(nextFont);
  };

  const toggleFont = () => {
    setFont(font === "geist" ? "inter" : "geist");
  };

  return {
    font,
    setFont,
    toggleFont,
  };
}

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_FONT, FONT_STORAGE_KEY, type AppFont } from "@/lib/font";

interface FontState {
  font: AppFont;
  setFont: (font: AppFont) => void;
}

export const useFontStore = create<FontState>()(
  persist(
    (set) => ({
      font: DEFAULT_FONT,
      setFont: (font) => set({ font }),
    }),
    {
      name: FONT_STORAGE_KEY,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" && window.localStorage
          ? window.localStorage
          : (globalThis.localStorage ?? {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }),
      ),
    },
  ),
);

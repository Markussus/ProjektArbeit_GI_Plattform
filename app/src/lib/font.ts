export type AppFont = "inter" | "geist";

export const DEFAULT_FONT: AppFont = "inter";
export const FONT_STORAGE_KEY = "font-storage";

function isBrowser() {
  return typeof window !== "undefined";
}

export function applyFont(font: AppFont) {
  if (!isBrowser()) return;

  const root = document.documentElement;
  root.dataset.font = font;
}

export function getStoredFont(): AppFont {
  if (!isBrowser()) return DEFAULT_FONT;

  try {
    const raw = window.localStorage.getItem(FONT_STORAGE_KEY);
    if (!raw) return DEFAULT_FONT;

    const parsed = JSON.parse(raw) as { state?: { font?: AppFont } };
    const storedFont = parsed?.state?.font;

    if (storedFont === "geist" || storedFont === "inter") {
      return storedFont;
    }

    return DEFAULT_FONT;
  } catch {
    return DEFAULT_FONT;
  }
}

export const CLOSE_DROPDOWNS_EVENT = "app:close-dropdowns";

export function notifyDropdownOpened(id: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(CLOSE_DROPDOWNS_EVENT, { detail: { id } }),
    );
  }
}

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface PopupProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Popup({ open, title, onClose, children }: PopupProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
        className="bg-card text-card-foreground ring-foreground/10 max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-lg ring-1"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <h2 id="popup-title" className="text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-9 items-center justify-center rounded-md border"
            aria-label="Close popup"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="overflow-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

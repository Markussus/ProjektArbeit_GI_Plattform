import { useTranslation } from "react-i18next";
import { AlertTriangle, X } from "lucide-react";

export interface ConfirmDialogProps {
  /** Ob der Dialog sichtbar ist */
  isOpen: boolean;
  /** Titel des Dialogs */
  title: string;
  /** Beschreibungstext */
  description: string;
  /** Label des Bestätigungs-Buttons (destruktiv) */
  confirmLabel?: string;
  /** Label des Abbrechen-Buttons */
  cancelLabel?: string;
  /** Callback wenn bestätigt */
  onConfirm: () => void;
  /** Callback wenn abgebrochen */
  onCancel: () => void;
  /** Variante des Dialogs, default "warning" */
  variant?: "warning" | "destructive";
}

/**
 * Modaler Bestätigungsdialog für destruktive Aktionen.
 * Zeigt eine Warnung mit Bestätigen- und Abbrechen-Button.
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = "warning",
}: ConfirmDialogProps) {
  const { t } = useTranslation("translation");

  if (!isOpen) return null;

  const isDestructive = variant === "destructive";

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 duration-150"
      onClick={onCancel}
    >
      <div
        className="bg-card border-border/50 animate-in zoom-in-95 relative w-full max-w-sm rounded-xl border p-6 shadow-xl duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground absolute top-4 right-4 rounded-md p-1"
          aria-label={t("common.close")}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon + Heading */}
        <div className="mb-4 flex items-start gap-3">
          <div
            className={`rounded-full p-2 ${isDestructive ? "bg-destructive/10" : "bg-orange-500/10"}`}
          >
            <AlertTriangle
              className={`h-5 w-5 ${isDestructive ? "text-destructive" : "text-orange-500"}`}
            />
          </div>
          <div>
            <h3 className="text-foreground font-semibold">{title}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="bg-muted hover:bg-muted/80 text-foreground flex-1 rounded-md px-4 py-2 text-sm font-medium"
          >
            {cancelLabel ?? t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium text-white ${
              isDestructive
                ? "bg-destructive hover:bg-destructive/90"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {confirmLabel ?? t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

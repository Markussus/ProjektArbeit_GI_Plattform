import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface DnfOperatorToolbarProps {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const operatorButtons = [
  { value: "¬", labelKey: "dnf.builder.insertNot" },
  { value: " ∧ ", labelKey: "dnf.builder.insertAnd" },
  { value: " ∨ ", labelKey: "dnf.builder.insertOr" },
  { value: "(", labelKey: "dnf.builder.insertOpenParen" },
  { value: ")", labelKey: "dnf.builder.insertCloseParen" },
];

export function DnfOperatorToolbar({
  inputRef,
  value,
  onChange,
  className,
}: DnfOperatorToolbarProps) {
  const { t } = useTranslation();

  const insertToken = (token: string) => {
    const input = inputRef.current;

    if (!input) {
      onChange(`${value}${token}`);
      return;
    }

    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;
    const nextValue = `${value.slice(0, selectionStart)}${token}${value.slice(selectionEnd)}`;
    const nextCursor = selectionStart + token.length;

    onChange(nextValue);
    window.requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-muted-foreground mr-1 text-xs font-medium">
        {t("dnf.builder.operatorHelp")}
      </span>
      {operatorButtons.map((button) => (
        <button
          key={button.value}
          type="button"
          onClick={() => insertToken(button.value)}
          aria-label={t(button.labelKey as never)}
          title={t(button.labelKey as never)}
          className="border-border bg-card hover:bg-muted min-h-8 min-w-8 rounded-md border px-2 font-mono text-sm font-semibold transition-colors"
        >
          {button.value.trim() || button.value}
        </button>
      ))}
    </div>
  );
}

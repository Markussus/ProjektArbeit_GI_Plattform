import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  CLOSE_DROPDOWNS_EVENT,
  notifyDropdownOpened,
} from "@/lib/dropdownEvents";
import { cn } from "@/lib/utils";

export interface DropdownSelectOption<T extends string> {
  value: T;
  label: ReactNode;
  triggerLabel?: ReactNode;
  description?: ReactNode;
}

export interface DropdownSelectProps<T extends string> {
  value: T;
  options: DropdownSelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  disabled?: boolean;
  triggerIcon?: ReactNode;
  triggerClassName?: string;
  chevronClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
  triggerTestId?: string;
  menuTestId?: string;
  optionTestIdPrefix?: string;
}

export function DropdownSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
  triggerIcon,
  triggerClassName,
  chevronClassName,
  menuClassName,
  optionClassName,
  triggerTestId,
  menuTestId,
  optionTestIdPrefix,
}: DropdownSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceId = useId();
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleOtherDropdownOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string }>;
      if (customEvent.detail?.id !== instanceId) {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener(CLOSE_DROPDOWNS_EVENT, handleOtherDropdownOpen);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener(
        CLOSE_DROPDOWNS_EVENT,
        handleOtherDropdownOpen,
      );
    };
  }, [instanceId]);

  if (!selectedOption) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen((previousValue) => {
              const next = !previousValue;
              if (next) {
                notifyDropdownOpened(instanceId);
              }
              return next;
            });
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen && !disabled}
        aria-label={ariaLabel}
        disabled={disabled}
        data-value={value}
        data-testid={triggerTestId}
        className={cn(
          "border-border bg-background text-foreground hover:bg-muted/60 focus-visible:ring-ring inline-flex items-center justify-between rounded-md border focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && !disabled && "bg-muted/70",
          triggerClassName,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {triggerIcon}
          {selectedOption.triggerLabel ?? selectedOption.label}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform",
            isOpen && !disabled && "rotate-180",
            chevronClassName,
          )}
        />
      </button>

      {isOpen && !disabled && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          data-testid={menuTestId}
          className={cn(
            "bg-popover text-popover-foreground border-border absolute top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-xl border p-1 shadow-lg",
            menuClassName,
          )}
        >
          {options.map((option) => {
            const isActive = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isActive}
                data-testid={
                  optionTestIdPrefix
                    ? `${optionTestIdPrefix}-${option.value}`
                    : undefined
                }
                onClick={() => {
                  setIsOpen(false);
                  onChange(option.value);
                }}
                className={cn(
                  "hover:bg-muted focus-visible:ring-ring flex w-full items-center justify-between rounded-lg px-3 py-2 text-left focus-visible:ring-2 focus-visible:outline-none",
                  isActive && "bg-muted",
                  optionClassName,
                )}
              >
                <span className="flex min-w-0 flex-col">
                  {option.label}
                  {option.description && (
                    <span className="text-muted-foreground text-xs">
                      {option.description}
                    </span>
                  )}
                </span>
                {isActive && <Check className="text-brand size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

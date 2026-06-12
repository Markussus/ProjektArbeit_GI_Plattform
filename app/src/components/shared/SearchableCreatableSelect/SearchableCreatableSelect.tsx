import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableCreatableSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onCreate?: (value: string) => void;
  ariaLabel: string;
  createLabel: string;
  notFoundLabel: string;
  disabled?: boolean;
  testId?: string;
}

export function SearchableCreatableSelect({
  value,
  options,
  onChange,
  onCreate,
  ariaLabel,
  createLabel,
  notFoundLabel,
  disabled = false,
  testId,
}: SearchableCreatableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const normalizedQuery = query.trim();
  const matchingOptions = useMemo(
    () =>
      options.filter((option) =>
        option.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
      ),
    [options, query],
  );
  const canCreate =
    Boolean(onCreate) &&
    normalizedQuery.length > 0 &&
    !options.some(
      (option) =>
        option.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase(),
    );

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const selectValue = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    setQuery("");
  };

  const createValue = () => {
    if (!canCreate) {
      return;
    }

    onCreate?.(normalizedQuery);
    setIsOpen(false);
    setQuery("");
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    if (matchingOptions.length === 1 && !canCreate) {
      selectValue(matchingOptions[0]);
      return;
    }

    createValue();
  };

  return (
    <div ref={containerRef} className="relative min-w-32">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((current) => !current)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        data-value={value}
        data-testid={testId}
        className="border-input bg-background text-foreground focus-visible:ring-ring flex h-9 w-full items-center justify-between gap-2 rounded-md border px-2 font-mono text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && !disabled && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="bg-popover text-popover-foreground border-border absolute top-[calc(100%+0.25rem)] left-0 z-40 w-64 rounded-lg border p-1 shadow-xl"
        >
          <div className="border-border relative border-b p-1 pb-2">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-[60%]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKeyDown}
              aria-label={`${ariaLabel} search`}
              data-testid={testId ? `${testId}-search` : undefined}
              className="border-input bg-background h-9 w-full rounded-md border pr-2 pl-9 text-sm outline-none focus:ring-1"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {matchingOptions.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={option === value}
                onClick={() => selectValue(option)}
                className={cn(
                  "hover:bg-muted flex w-full items-center justify-between rounded-md px-3 py-2 text-left font-mono text-sm",
                  option === value && "bg-muted",
                )}
              >
                <span className="truncate">{option}</span>
                {option === value && (
                  <Check className="text-brand size-4 shrink-0" />
                )}
              </button>
            ))}

            {matchingOptions.length === 0 && !canCreate && (
              <p className="text-muted-foreground px-3 py-2 text-sm">
                {notFoundLabel}
              </p>
            )}

            {canCreate && (
              <button
                type="button"
                onClick={createValue}
                data-testid={testId ? `${testId}-create` : undefined}
                className="hover:bg-muted text-foreground flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm"
              >
                <Plus className="text-brand size-4 shrink-0" />
                <span className="text-muted-foreground">{createLabel}</span>
                <span className="truncate font-mono font-semibold">
                  {normalizedQuery}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

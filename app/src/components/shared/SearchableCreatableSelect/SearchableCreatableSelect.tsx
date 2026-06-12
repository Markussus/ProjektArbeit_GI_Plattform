import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
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
  const menuRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState({
    left: 0,
    top: 0,
    maxHeight: 224,
  });
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
      if (
        !containerRef.current?.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      ) {
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
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const menuWidth = 256;
        const gap = 4;
        const viewportPadding = 8;
        const availableBelow = window.innerHeight - rect.bottom - gap;
        const availableAbove = rect.top - gap;
        const openAbove =
          availableBelow < 280 && availableAbove > availableBelow;
        const maxHeight = Math.max(
          120,
          Math.min(280, openAbove ? availableAbove : availableBelow),
        );
        setMenuPosition({
          left: Math.min(
            Math.max(viewportPadding, rect.left),
            window.innerWidth - menuWidth - viewportPadding,
          ),
          top: openAbove
            ? Math.max(viewportPadding, rect.top - maxHeight - gap)
            : rect.bottom + gap,
          maxHeight,
        });
      }
      setActiveIndex(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const closeOnScroll = (event: Event) => {
      if (
        event.target instanceof Node &&
        menuRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsOpen(false);
      setQuery("");
    };
    window.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("resize", closeOnScroll);
    return () => {
      window.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("resize", closeOnScroll);
    };
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
    const itemCount = matchingOptions.length + (canCreate ? 1 : 0);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (itemCount === 0) {
        return;
      }
      setActiveIndex((current) => {
        const direction = event.key === "ArrowDown" ? 1 : -1;
        const next = (current + direction + itemCount) % itemCount;
        window.setTimeout(() =>
          optionRefs.current[next]?.scrollIntoView({
            block: "nearest",
          }),
        );
        return next;
      });
      return;
    }
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    if (activeIndex < matchingOptions.length) {
      selectValue(matchingOptions[activeIndex]);
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

      {isOpen &&
        !disabled &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              left: menuPosition.left,
              top: menuPosition.top,
              maxHeight: menuPosition.maxHeight,
            }}
            className="bg-popover text-popover-foreground border-border fixed z-[100] flex w-64 flex-col overflow-hidden rounded-lg border p-1 shadow-xl"
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

            <div className="min-h-0 flex-1 overflow-y-auto py-1">
              {matchingOptions.map((option, index) => (
                <button
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  key={option}
                  type="button"
                  role="option"
                  data-testid={
                    testId ? `${testId}-option-${option}` : undefined
                  }
                  aria-selected={option === value}
                  onClick={() => selectValue(option)}
                  className={cn(
                    "hover:bg-muted flex w-full items-center justify-between rounded-md px-3 py-2 text-left font-mono text-sm",
                    (option === value || index === activeIndex) && "bg-muted",
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
                  ref={(element) => {
                    optionRefs.current[matchingOptions.length] = element;
                  }}
                  type="button"
                  onClick={createValue}
                  data-testid={testId ? `${testId}-create` : undefined}
                  className={cn(
                    "hover:bg-muted text-foreground flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm",
                    activeIndex === matchingOptions.length && "bg-muted",
                  )}
                >
                  <Plus className="text-brand size-4 shrink-0" />
                  <span className="text-muted-foreground">{createLabel}</span>
                  <span className="truncate font-mono font-semibold">
                    {normalizedQuery}
                  </span>
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

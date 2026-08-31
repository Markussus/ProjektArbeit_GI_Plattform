import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Pencil, Plus, Search } from "lucide-react";
import {
  CLOSE_DROPDOWNS_EVENT,
  notifyDropdownOpened,
} from "@/lib/dropdownEvents";
import { cn } from "@/lib/utils";

export interface SearchableCreatableSelectProps {
  value: string;
  options?: string[];
  onChange: (value: string) => void;
  onCreate?: (value: string) => void;
  onRename?: (previousValue: string, nextValue: string) => void;
  ariaLabel: string;
  createLabel: (value: string) => string;
  renameLabel?: (previousValue: string, nextValue: string) => string;
  emptyCreateLabel: string;
  notFoundLabel: string;
  searchPlaceholder: string;
  disabled?: boolean;
  testId?: string;
  className?: string;
  style?: CSSProperties;
}

export function SearchableCreatableSelect({
  value,
  options = [],
  onChange,
  onCreate,
  onRename,
  ariaLabel,
  createLabel,
  renameLabel,
  emptyCreateLabel,
  notFoundLabel,
  searchPlaceholder,
  disabled = false,
  testId,
  className,
  style,
}: SearchableCreatableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const instanceId = useId();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [menuPosition, setMenuPosition] = useState({
    left: 0,
    top: 0,
    maxHeight: 280,
  });

  const normalizedQuery = query.trim();

  const matchingOptions = useMemo(
    () =>
      (options ?? []).filter((option) =>
        option
          .toLocaleLowerCase()
          .includes(normalizedQuery.toLocaleLowerCase()),
      ),
    [options, normalizedQuery],
  );

  const isExactOptionMatch = useMemo(
    () =>
      (options ?? []).some(
        (option) =>
          option.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase(),
      ),
    [options, normalizedQuery],
  );

  const canCreate = Boolean(
    onCreate && (normalizedQuery.length === 0 || !isExactOptionMatch),
  );

  const canRename = Boolean(
    onRename &&
    value &&
    value.trim().length > 0 &&
    normalizedQuery.length > 0 &&
    normalizedQuery !== value &&
    !isExactOptionMatch,
  );

  // Total navigable action items: options -> create -> rename
  const createActionIndex = canCreate ? matchingOptions.length : -1;
  const renameActionIndex = canRename
    ? canCreate
      ? matchingOptions.length + 1
      : matchingOptions.length
    : -1;
  const totalNavigableItems =
    matchingOptions.length + (canCreate ? 1 : 0) + (canRename ? 1 : 0);

  const openMenu = () => {
    if (disabled) return;
    notifyDropdownOpened(instanceId);
    setIsOpen(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setQuery("");
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const selectValue = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    setQuery("");
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const executeCreate = (nextValue: string) => {
    if (!onCreate) return;
    onCreate(nextValue);
    setIsOpen(false);
    setQuery("");
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const executeRename = (nextValue: string) => {
    if (!onRename) return;
    onRename(value, nextValue);
    setIsOpen(false);
    setQuery("");
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node | null;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
      setQuery("");
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
        window.setTimeout(() => triggerRef.current?.focus(), 0);
      }
    };

    const handleOtherDropdownOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string }>;
      if (customEvent.detail?.id !== instanceId) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener(CLOSE_DROPDOWNS_EVENT, handleOtherDropdownOpen);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener(
        CLOSE_DROPDOWNS_EVENT,
        handleOtherDropdownOpen,
      );
    };
  }, [instanceId, isOpen]);

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
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const close = () => {
      setIsOpen(false);
      setQuery("");
    };
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [isOpen]);

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (totalNavigableItems === 0) return;
      setActiveIndex((current) => {
        const direction = event.key === "ArrowDown" ? 1 : -1;
        const next =
          (current + direction + totalNavigableItems) % totalNavigableItems;
        window.setTimeout(() =>
          optionRefs.current[next]?.scrollIntoView({ block: "nearest" }),
        );
        return next;
      });
      return;
    }

    if (event.key !== "Enter") return;

    event.preventDefault();
    if (activeIndex >= 0 && activeIndex < matchingOptions.length) {
      selectValue(matchingOptions[activeIndex]);
      return;
    }
    if (canCreate && activeIndex === createActionIndex) {
      executeCreate(normalizedQuery);
      return;
    }
    if (canRename && activeIndex === renameActionIndex) {
      executeRename(normalizedQuery);
      return;
    }

    // Default Enter behavior when query was typed without specific navigation
    if (canCreate) {
      executeCreate(normalizedQuery);
    } else if (canRename) {
      executeRename(normalizedQuery);
    }
  };

  return (
    <div
      ref={containerRef}
      style={style}
      className={cn("relative min-w-32", className)}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!disabled) {
            if (isOpen) {
              closeMenu();
            } else {
              openMenu();
            }
          }
        }}
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
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                aria-label={`${ariaLabel} search`}
                placeholder={searchPlaceholder}
                data-testid={testId ? `${testId}-search` : undefined}
                className="border-input bg-background h-9 w-full rounded-md border pr-2 pl-9 text-sm outline-none focus:ring-1"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div
              data-testid={testId ? `${testId}-options` : undefined}
              className="max-h-[180px] min-h-0 overflow-y-auto py-1"
            >
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
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    selectValue(option);
                  }}
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

              {matchingOptions.length === 0 && (
                <p className="text-muted-foreground px-3 py-2 text-sm">
                  {notFoundLabel}
                </p>
              )}
            </div>

            {(onCreate || canRename) && (
              <div className="border-border flex flex-col gap-0.5 border-t pt-1">
                {onCreate && (
                  <button
                    ref={(element) => {
                      if (createActionIndex >= 0) {
                        optionRefs.current[createActionIndex] = element;
                      }
                    }}
                    type="button"
                    disabled={!canCreate}
                    onPointerDown={(event) => {
                      if (!canCreate) return;
                      event.preventDefault();
                      event.stopPropagation();
                      executeCreate(normalizedQuery);
                    }}
                    data-testid={testId ? `${testId}-create` : undefined}
                    className={cn(
                      "hover:bg-muted text-foreground flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50",
                      canCreate &&
                        activeIndex === createActionIndex &&
                        "bg-muted",
                    )}
                  >
                    <Plus className="text-brand size-4 shrink-0" />
                    <span className="truncate">
                      {normalizedQuery
                        ? createLabel(normalizedQuery)
                        : emptyCreateLabel}
                    </span>
                  </button>
                )}

                {canRename && (
                  <button
                    ref={(element) => {
                      if (renameActionIndex >= 0) {
                        optionRefs.current[renameActionIndex] = element;
                      }
                    }}
                    type="button"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      executeRename(normalizedQuery);
                    }}
                    data-testid={testId ? `${testId}-rename` : undefined}
                    className={cn(
                      "hover:bg-muted text-foreground flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm",
                      activeIndex === renameActionIndex && "bg-muted",
                    )}
                  >
                    <Pencil className="text-brand size-4 shrink-0" />
                    <span className="truncate">
                      {renameLabel
                        ? renameLabel(value, normalizedQuery)
                        : `"${value}" in "${normalizedQuery}" umbenennen`}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

import { useId, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Pencil, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSearchableCreatableSelectState,
  type SearchableCreatableSelectState,
} from "./useSearchableCreatableSelectState";

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
  const instanceId = useId();
  const selectState = useSearchableCreatableSelectState({
    value,
    options,
    onChange,
    onCreate,
    onRename,
    disabled,
    instanceId,
  });
  const { isOpen, containerRef, triggerRef, openMenu, closeMenu } = selectState;

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
          <SearchableSelectMenu
            state={selectState}
            value={value}
            ariaLabel={ariaLabel}
            createLabel={createLabel}
            renameLabel={renameLabel}
            emptyCreateLabel={emptyCreateLabel}
            notFoundLabel={notFoundLabel}
            searchPlaceholder={searchPlaceholder}
            showCreateAction={Boolean(onCreate)}
            testId={testId}
          />,
          document.body,
        )}
    </div>
  );
}

function SearchableSelectMenu({
  state,
  value,
  ariaLabel,
  createLabel,
  renameLabel,
  emptyCreateLabel,
  notFoundLabel,
  searchPlaceholder,
  showCreateAction,
  testId,
}: {
  state: SearchableCreatableSelectState;
  value: string;
  ariaLabel: string;
  createLabel: (value: string) => string;
  renameLabel?: (previousValue: string, nextValue: string) => string;
  emptyCreateLabel: string;
  notFoundLabel: string;
  searchPlaceholder: string;
  showCreateAction: boolean;
  testId?: string;
}) {
  const {
    query,
    setQuery,
    activeIndex,
    setActiveIndex,
    menuPosition,
    normalizedQuery,
    matchingOptions,
    canCreate,
    canRename,
    createActionIndex,
    renameActionIndex,
    menuRef,
    inputRef,
    setOptionRef,
    selectValue,
    executeCreate,
    executeRename,
    handleInputKeyDown,
  } = state;

  return (
    <div
      ref={menuRef}
      role="listbox"
      aria-label={ariaLabel}
      style={menuPosition}
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
              setOptionRef(index, element);
            }}
            key={option}
            type="button"
            role="option"
            data-testid={testId ? `${testId}-option-${option}` : undefined}
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

      {(showCreateAction || canRename) && (
        <div className="border-border flex flex-col gap-0.5 border-t pt-1">
          {showCreateAction && (
            <button
              ref={(element) => {
                if (createActionIndex >= 0) {
                  setOptionRef(createActionIndex, element);
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
                canCreate && activeIndex === createActionIndex && "bg-muted",
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
                  setOptionRef(renameActionIndex, element);
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
    </div>
  );
}

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  CLOSE_DROPDOWNS_EVENT,
  notifyDropdownOpened,
} from "@/lib/dropdownEvents";

interface UseSearchableCreatableSelectStateOptions {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onCreate?: (value: string) => void;
  onRename?: (previousValue: string, nextValue: string) => void;
  disabled: boolean;
  instanceId: string;
}

function focusTrigger(trigger: HTMLButtonElement | null): void {
  window.setTimeout(() => trigger?.focus(), 0);
}

export function useSearchableCreatableSelectState({
  value,
  options,
  onChange,
  onCreate,
  onRename,
  disabled,
  instanceId,
}: UseSearchableCreatableSelectStateOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState({
    left: 0,
    top: 0,
    maxHeight: 280,
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
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
  const isExactOptionMatch = (options ?? []).some(
    (option) =>
      option.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase(),
  );
  const canCreate = Boolean(
    onCreate && (normalizedQuery.length === 0 || !isExactOptionMatch),
  );
  const canRename = Boolean(
    onRename &&
    value.trim() &&
    normalizedQuery &&
    normalizedQuery !== value &&
    !isExactOptionMatch,
  );
  const createActionIndex = canCreate ? matchingOptions.length : -1;
  const renameActionIndex = canRename
    ? matchingOptions.length + (canCreate ? 1 : 0)
    : -1;
  const totalNavigableItems =
    matchingOptions.length + Number(canCreate) + Number(canRename);

  const resetAndClose = useCallback((restoreFocus: boolean) => {
    setIsOpen(false);
    setQuery("");
    if (restoreFocus) focusTrigger(triggerRef.current);
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    notifyDropdownOpened(instanceId);
    setIsOpen(true);
  }, [disabled, instanceId]);

  const closeMenu = useCallback(() => resetAndClose(true), [resetAndClose]);
  const selectValue = useCallback(
    (nextValue: string) => {
      onChange(nextValue);
      resetAndClose(true);
    },
    [onChange, resetAndClose],
  );
  const executeCreate = useCallback(
    (nextValue: string) => {
      if (!onCreate) return;
      onCreate(nextValue);
      resetAndClose(true);
    },
    [onCreate, resetAndClose],
  );
  const executeRename = useCallback(
    (nextValue: string) => {
      if (!onRename) return;
      onRename(value, nextValue);
      resetAndClose(true);
    },
    [onRename, resetAndClose, value],
  );
  const setOptionRef = useCallback(
    (index: number, element: HTMLButtonElement | null) => {
      optionRefs.current[index] = element;
    },
    [],
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node | null;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      resetAndClose(false);
    };
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) resetAndClose(true);
    };
    const handleOtherDropdownOpen = (event: Event) => {
      const sourceId = (event as CustomEvent<{ id: string }>).detail?.id;
      if (sourceId !== instanceId) resetAndClose(false);
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
  }, [instanceId, isOpen, resetAndClose]);

  useEffect(() => {
    if (!isOpen) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 256;
      const gap = 4;
      const viewportPadding = 8;
      const availableBelow = window.innerHeight - rect.bottom - gap;
      const availableAbove = rect.top - gap;
      const openAbove = availableBelow < 280 && availableAbove > availableBelow;
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
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const close = () => resetAndClose(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [isOpen, resetAndClose]);

  const handleArrowNavigation = (key: "ArrowDown" | "ArrowUp") => {
    if (totalNavigableItems === 0) return;
    setActiveIndex((current) => {
      const direction = key === "ArrowDown" ? 1 : -1;
      const next =
        (current + direction + totalNavigableItems) % totalNavigableItems;
      window.setTimeout(() =>
        optionRefs.current[next]?.scrollIntoView({ block: "nearest" }),
      );
      return next;
    });
  };

  const handleEnterAction = () => {
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
    if (canCreate) {
      executeCreate(normalizedQuery);
      return;
    }
    if (canRename) {
      executeRename(normalizedQuery);
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      handleArrowNavigation(event.key);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      handleEnterAction();
    }
  };

  return {
    isOpen,
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
    containerRef,
    triggerRef,
    menuRef,
    inputRef,
    setOptionRef,
    openMenu,
    closeMenu,
    selectValue,
    executeCreate,
    executeRename,
    handleInputKeyDown,
  };
}

export type SearchableCreatableSelectState = ReturnType<
  typeof useSearchableCreatableSelectState
>;

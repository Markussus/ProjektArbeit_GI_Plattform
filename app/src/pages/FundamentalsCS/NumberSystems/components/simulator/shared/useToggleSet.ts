import { useState } from "react";

/**
 * Custom Hook für ein Set<string> das Expand/Collapse-Zustände
 * von collapsible Steps verwaltet.
 *
 * @param initial - Schlüssel, die initial als "expanded" gelten.
 */
export function useToggleSet(initial: string[] = ["0", "1", "2"]) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(initial));

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return { expanded, toggle };
}

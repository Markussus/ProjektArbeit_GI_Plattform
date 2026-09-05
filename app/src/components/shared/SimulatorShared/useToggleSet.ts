import { useState } from "react";

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

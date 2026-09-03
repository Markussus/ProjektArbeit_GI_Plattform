import type { Utf8BitSegment } from "../utils/utf8Utils";

interface Utf8BitDisplayProps {
  segments: Utf8BitSegment[];
}

export function Utf8BitDisplay({ segments }: Utf8BitDisplayProps) {
  return (
    <span className="font-mono">
      {segments.map((seg, i) => (
        <span
          key={i}
          className={
            seg.type === "control"
              ? "font-bold text-red-500 dark:text-red-400"
              : "text-blue-500 dark:text-blue-400"
          }
        >
          {seg.bits}
        </span>
      ))}
    </span>
  );
}

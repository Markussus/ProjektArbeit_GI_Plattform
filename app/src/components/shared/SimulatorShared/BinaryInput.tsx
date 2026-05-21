interface BinaryInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  locked: boolean;
  /** Input type, defaults to "text" */
  type?: "text" | "number";
  /** Additional props forwarded to the <input> element */
  min?: number;
  max?: number;
}

/**
 * Einzel-Eingabefeld für binäre (oder numerische) Werte
 * mit einheitlichem locked/unlocked-Styling.
 */
export function BinaryInput({
  label,
  value,
  onChange,
  locked,
  type = "text",
  min,
  max,
}: BinaryInputProps) {
  return (
    <div className={locked ? "opacity-60" : ""}>
      <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
        {label}
      </label>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        readOnly={locked}
        className={`bg-background text-foreground w-full rounded-md border px-3 py-2 font-mono text-sm tracking-widest focus:outline-none ${
          locked
            ? "bg-muted border-input pointer-events-none"
            : "border-input focus:border-primary focus:ring-primary/20 focus:ring-1"
        }`}
      />
    </div>
  );
}

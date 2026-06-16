interface ModeToggleOption<T extends string> {
  value: T;
  label: string;
}

interface ModeToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ModeToggleOption<T>[];
  disabled?: boolean;
}

export function ModeToggle<T extends string>({
  value,
  onChange,
  options,
  disabled = false,
}: ModeToggleProps<T>) {
  return (
    <div className="bg-muted mb-2 flex shrink-0 rounded-md p-1 sm:mb-0">
      {options.map((option) => (
        <button
          key={option.value}
          data-testid={`mode-toggle-${option.value}`}
          onClick={() => onChange(option.value)}
          disabled={disabled}
          className={`rounded-sm px-3 py-1.5 text-xs font-medium ${
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

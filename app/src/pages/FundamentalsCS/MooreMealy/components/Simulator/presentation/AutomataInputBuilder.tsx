import { useState, type DragEvent } from "react";
import { GripVertical, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export interface AutomataInputBuilderProps {
  inputSymbols: string[];
  inputWord: string[];
  onChange: (inputWord: string[]) => void;
  testIdPrefix?: string;
}

export function AutomataInputBuilder({
  inputSymbols,
  inputWord,
  onChange,
  testIdPrefix = "moore",
}: AutomataInputBuilderProps) {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);

  const addSymbol = (symbol: string) => {
    if (!inputSymbols.includes(symbol)) {
      return;
    }
    onChange([...inputWord, symbol]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    addSymbol(event.dataTransfer.getData("text/plain"));
  };

  return (
    <section className="space-y-2">
      <label className="text-sm font-semibold">
        {t("moore-mealy.sim.inputWord")}
      </label>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        data-testid={`${testIdPrefix}-input-word`}
        className={cn(
          "border-input bg-background focus-within:ring-ring flex min-h-14 flex-wrap items-center gap-2 rounded-lg border p-2 focus-within:ring-2",
          isDragOver && "border-brand bg-brand/5",
        )}
      >
        {inputWord.map((symbol, index) => (
          <span
            key={`${symbol}-${index}`}
            data-testid={`${testIdPrefix}-input-word-token-${index}`}
            className="bg-muted inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-sm"
          >
            {symbol}
            <button
              type="button"
              data-testid={`${testIdPrefix}-input-word-token-${index}-remove`}
              onClick={() =>
                onChange(
                  inputWord.filter((_, itemIndex) => itemIndex !== index),
                )
              }
              aria-label={t("moore-mealy.sim.removeWordSymbol", {
                symbol,
                index: index + 1,
              })}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        {inputWord.length === 0 && (
          <span className="text-muted-foreground px-1 text-sm italic">
            {t("moore-mealy.sim.inputDropPlaceholder")}
          </span>
        )}
      </div>

      <div>
        <p className="text-muted-foreground mb-2 text-xs">
          {t("moore-mealy.sim.inputAlphabetHelp")}
        </p>
        <div
          data-testid={`${testIdPrefix}-input-alphabet`}
          className="border-border flex min-h-12 flex-wrap gap-2 rounded-lg border p-2"
        >
          {inputSymbols.map((symbol) => (
            <button
              key={symbol}
              type="button"
              data-testid={`${testIdPrefix}-input-token-${symbol}`}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", symbol);
                event.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => addSymbol(symbol)}
              className="bg-muted hover:border-brand hover:text-brand inline-flex cursor-grab items-center gap-1 rounded-md border px-2 py-1 font-mono text-sm active:cursor-grabbing"
            >
              <GripVertical className="text-muted-foreground size-3.5" />
              {symbol}
            </button>
          ))}
          {inputSymbols.length === 0 && (
            <span className="text-muted-foreground p-1 text-sm italic">
              {t("moore-mealy.sim.noSymbols")}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

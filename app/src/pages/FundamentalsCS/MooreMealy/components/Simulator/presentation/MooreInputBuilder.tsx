import { useState, type DragEvent, type KeyboardEvent } from "react";
import { GripVertical, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface MooreInputBuilderProps {
  inputSymbols: string[];
  inputWord: string[];
  onChange: (inputWord: string[]) => void;
}

export function MooreInputBuilder({
  inputSymbols,
  inputWord,
  onChange,
}: MooreInputBuilderProps) {
  const { t } = useTranslation();
  const [typedSymbol, setTypedSymbol] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const addSymbol = (symbol: string) => {
    if (!inputSymbols.includes(symbol)) {
      return;
    }
    onChange([...inputWord, symbol]);
    setTypedSymbol("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSymbol(typedSymbol.trim());
    }
    if (event.key === "Backspace" && typedSymbol === "" && inputWord.length) {
      onChange(inputWord.slice(0, -1));
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    addSymbol(event.dataTransfer.getData("text/plain"));
  };

  return (
    <section className="space-y-2">
      <label className="text-sm font-semibold">
        {t("moore.sim.inputWord")}
      </label>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        data-testid="moore-input-word"
        className={cn(
          "border-input bg-background focus-within:ring-ring flex min-h-14 flex-wrap items-center gap-2 rounded-lg border p-2 focus-within:ring-2",
          isDragOver && "border-brand bg-brand/5",
        )}
      >
        {inputWord.map((symbol, index) => (
          <span
            key={`${symbol}-${index}`}
            className="bg-muted inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-sm"
          >
            {symbol}
            <button
              type="button"
              onClick={() =>
                onChange(
                  inputWord.filter((_, itemIndex) => itemIndex !== index),
                )
              }
              aria-label={t("moore.sim.removeWordSymbol", {
                symbol,
                index: index + 1,
              })}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          value={typedSymbol}
          onChange={(event) => setTypedSymbol(event.target.value)}
          onKeyDown={handleKeyDown}
          list="moore-input-symbol-options"
          placeholder={t("moore.sim.inputWordPlaceholder")}
          className="min-w-44 flex-1 bg-transparent px-1 py-1 font-mono text-sm outline-none"
          data-testid="moore-input-word-entry"
        />
        <datalist id="moore-input-symbol-options">
          {inputSymbols.map((symbol) => (
            <option key={symbol} value={symbol} />
          ))}
        </datalist>
      </div>

      <div>
        <p className="text-muted-foreground mb-2 text-xs">
          {t("moore.sim.inputAlphabetHelp")}
        </p>
        <div
          data-testid="moore-input-alphabet"
          className="border-border flex min-h-12 flex-wrap gap-2 rounded-lg border p-2"
        >
          {inputSymbols.map((symbol) => (
            <button
              key={symbol}
              type="button"
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
              {t("moore.sim.noSymbols")}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

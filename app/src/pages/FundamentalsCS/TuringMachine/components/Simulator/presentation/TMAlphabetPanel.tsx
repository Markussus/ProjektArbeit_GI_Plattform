import { useTranslation } from "react-i18next";

export interface TMAlphabetPanelProps {
  title: string;
  symbols: string[];
  testId?: string;
}

export function TMAlphabetPanel({
  title,
  symbols,
  testId,
}: TMAlphabetPanelProps) {
  const { t } = useTranslation();

  return (
    <div data-testid={testId} className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>

      <div
        data-testid={testId ? `${testId}-symbols` : undefined}
        className="bg-card flex min-h-12 flex-wrap gap-1.5 rounded border px-3 py-2"
      >
        {symbols.length > 0 ? (
          symbols.map((symbol) => (
            <span
              key={symbol}
              data-testid={testId ? `${testId}-symbol-${symbol}` : undefined}
              className="bg-muted text-foreground rounded border px-2 py-0.5 font-mono text-sm"
            >
              {symbol}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground text-sm italic">
            {t("turing-machine.config.alphabets.noSymbols")}
          </span>
        )}
      </div>
    </div>
  );
}

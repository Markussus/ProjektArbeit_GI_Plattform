import { useTranslation } from "react-i18next";

export interface TMAlphabetPanelProps {
  title: string;
  symbols: string[];
}

export function TMAlphabetPanel({ title, symbols }: TMAlphabetPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>

      <div className="bg-card flex min-h-12 flex-wrap gap-1.5 rounded border px-3 py-2">
        {symbols.length > 0 ? (
          symbols.map((symbol) => (
            <span
              key={symbol}
              className="bg-muted text-foreground rounded border px-2 py-0.5 font-mono text-sm"
            >
              {symbol}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground text-sm italic">
            {t("tm.config.alphabets.noSymbols")}
          </span>
        )}
      </div>
    </div>
  );
}

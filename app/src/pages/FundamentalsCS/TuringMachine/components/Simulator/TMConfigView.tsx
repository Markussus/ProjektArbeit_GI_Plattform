import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TableView } from '@/components/shared/TableVisual/TableView';
import type { TMConfig } from './types';
import { formatState, parseTransition, formatTransition } from './types';

export interface TMConfigViewProps {
  config: TMConfig;
  onChange: (newConfig: TMConfig) => void;
}

export function TMConfigView({ config, onChange }: TMConfigViewProps) {
  const { t } = useTranslation();

  const handleInitialTapeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onChange({ ...config, initialTape: value.split('') });
  };

  const tableHeaders: string[] = ['δ', ...config.states.map(formatState)];

  const tableRows = useMemo(() => {
    return config.tapeAlphabet.map(symbol => {
      const row: string[] = [symbol];
      config.states.forEach(state => {
        const trans = config.transitions[symbol]?.[state];
        row.push(formatTransition(trans));
      });
      return row;
    });
  }, [config.tapeAlphabet, config.states, config.transitions]);

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    if (colIndex === 0) return; // Cannot edit the symbol column directly here

    const symbol = config.tapeAlphabet[rowIndex];
    const state = config.states[colIndex - 1]; // Offset by 1 for the symbol column

    // Copy transitions
    const newTransitions = JSON.parse(JSON.stringify(config.transitions));

    const parsed = parseTransition(value);
    if (parsed) {
      if (!newTransitions[symbol]) newTransitions[symbol] = {};
      newTransitions[symbol][state] = parsed;
    } else {
      // If cleared or invalid format, we might remove the transition
      if (value.trim() === '') {
        if (newTransitions[symbol] && newTransitions[symbol][state]) {
          delete newTransitions[symbol][state];
        }
      }
    }

    onChange({ ...config, transitions: newTransitions });
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        <h2 className="text-lg font-bold">{t('tm.config.title', 'Turing Machine Configuration')}</h2>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">{t('tm.config.initialTape', 'Initial Tape Word')}</label>
          <input
            type="text"
            className="border rounded p-2 text-lg font-mono"
            value={config.initialTape.join('')}
            onChange={handleInitialTapeChange}
            placeholder={t('tm.config.initialTapePlaceholder', 'Enter input word (e.g., 1011)')}
          />
        </div>

        <div className="flex flex-col gap-2 mt-6">
          <h3 className="text-md font-semibold">{t('tm.config.transitionTable', 'Transition Table')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('tm.config.transitionFormat', 'Format:')} <code>(Next State, Write Symbol, Movement)</code>
            {t('tm.config.transitionExample', ' e.g., (q1, 0, R)')}
          </p>
          <TableView
            headers={tableHeaders}
            rows={tableRows}
            editable={true}
            onCellChange={handleCellChange}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

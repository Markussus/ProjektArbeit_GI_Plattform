import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TableView } from '@/components/shared/TableVisual/TableView';
import type { TMConfig, TMTransition, HeadMovement } from './types';

export interface TMConfigViewProps {
  config: TMConfig;
  onChange: (newConfig: TMConfig) => void;
}

// Helper to wrap digits in subscript (e.g., q0 -> q₀)
function formatStateHeader(state: string) {
  return state.replace(/\d+/g, (match) => {
    return match.split('').map(d => String.fromCharCode(8320 + parseInt(d))).join('');
  });
}

// Parses string like "(q1, 0, R)" into transition object
function parseTransition(cellValue: string): TMTransition | null {
  const match = cellValue.match(/^\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([LNR])\s*\)\s*$/);
  if (match) {
    return {
      nextState: match[1].trim(),
      writeSymbol: match[2].trim(),
      movement: match[3].trim() as HeadMovement
    };
  }
  return null;
}

// Formats transition object into string like "(q1, 0, R)"
function formatTransition(transition?: TMTransition): string {
  if (!transition) return '';
  return `(${transition.nextState}, ${transition.writeSymbol}, ${transition.movement})`;
}

export function TMConfigView({ config, onChange }: TMConfigViewProps) {
  const { t } = useTranslation();

  const handleInitialTapeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onChange({ ...config, initialTape: value.split('') });
  };

  const tableHeaders = ['δ', ...config.states.map(formatStateHeader)];

  const tableRows = useMemo(() => {
    return config.tapeAlphabet.map(symbol => {
      const row = [symbol];
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


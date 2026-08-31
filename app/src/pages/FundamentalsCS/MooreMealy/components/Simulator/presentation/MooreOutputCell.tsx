import { useTranslation } from "react-i18next";
import { SearchableCreatableSelect } from "@/components/shared/SearchableCreatableSelect";
import { cn } from "@/lib/utils";
import {
  formatInternalNumber,
  parseInternalNumber,
} from "../domain/mooreProgram";
import type { MooreOutput, MooreProgram } from "../domain/mooreTypes";

interface MooreOutputCellProps {
  state: string;
  stateIndex: number;
  output?: MooreOutput;
  outputOptions: string[];
  symbolWidth: string;
  isInitialState: boolean;
  representation: MooreProgram["representation"];
  onOutputSymbolChange: (state: string, symbol: string) => void;
  onOutputSymbolCreate: (state: string, symbol: string) => void;
  onOutputSymbolRename?: (previousSymbol: string, nextSymbol: string) => void;
  onOutputCodeChange: (state: string, code: number) => void;
}

export function MooreOutputCell({
  state,
  stateIndex,
  output,
  outputOptions,
  symbolWidth,
  isInitialState,
  representation,
  onOutputSymbolChange,
  onOutputSymbolCreate,
  onOutputSymbolRename,
  onOutputCodeChange,
}: MooreOutputCellProps) {
  const { t } = useTranslation();

  return (
    <td
      key={state}
      className={cn("border-r p-2", isInitialState && "bg-brand/5")}
    >
      <div className="inline-flex w-max items-center gap-2">
        <SearchableCreatableSelect
          value={output?.symbol ?? ""}
          options={outputOptions}
          onChange={(symbol) => onOutputSymbolChange(state, symbol)}
          onCreate={(symbol) => onOutputSymbolCreate(state, symbol)}
          onRename={(prev, next) =>
            onOutputSymbolRename
              ? onOutputSymbolRename(prev, next)
              : onOutputSymbolChange(state, next)
          }
          ariaLabel={t("moore-mealy.sim.outputForState", { state })}
          createLabel={(symbol) =>
            t("moore-mealy.sim.createNamedOutput", { symbol })
          }
          renameLabel={(previous, next) =>
            t("moore-mealy.sim.renameNamedOutput", { previous, next })
          }
          emptyCreateLabel={t("moore-mealy.sim.createOutput")}
          notFoundLabel={t("moore-mealy.sim.outputNotFound")}
          searchPlaceholder={t("moore-mealy.sim.search")}
          testId={`moore-output-symbol-${stateIndex}`}
          className="min-w-0"
          style={{ width: symbolWidth }}
        />
        <input
          key={`${representation}-${output?.code ?? 0}`}
          defaultValue={formatInternalNumber(output?.code ?? 0, representation)}
          onBlur={(event) => {
            const code = parseInternalNumber(
              event.currentTarget.value,
              representation,
            );
            if (code === null) {
              event.currentTarget.value = formatInternalNumber(
                output?.code ?? 0,
                representation,
              );
              return;
            }
            onOutputCodeChange(state, code);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          aria-label={t("moore-mealy.sim.outputCodeForState", { state })}
          data-testid={`moore-output-code-${stateIndex}`}
          className="border-input bg-background focus:ring-ring h-9 w-[7ch] rounded-md border px-2 font-mono outline-none focus:ring-1"
        />
      </div>
    </td>
  );
}

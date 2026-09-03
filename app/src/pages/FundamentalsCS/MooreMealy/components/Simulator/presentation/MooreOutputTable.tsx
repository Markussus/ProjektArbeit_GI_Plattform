import { useTranslation } from "react-i18next";
import type { MooreOutput, MooreProgram } from "../domain/mooreTypes";
import { MooreOutputCell } from "./MooreOutputCell";

interface MooreOutputTableProps {
  program: Pick<
    MooreProgram,
    "states" | "outputs" | "initialState" | "representation"
  >;
  outputAlphabet: MooreOutput[];
  onOutputSymbolChange: (state: string, symbol: string) => void;
  onOutputSymbolCreate: (state: string, symbol: string) => void;
  onOutputSymbolRename?: (previousSymbol: string, nextSymbol: string) => void;
  onOutputCodeChange: (state: string, code: number) => void;
}

export function MooreOutputTable({
  program,
  outputAlphabet,
  onOutputSymbolChange,
  onOutputSymbolCreate,
  onOutputSymbolRename,
  onOutputCodeChange,
}: MooreOutputTableProps) {
  const { t } = useTranslation();
  const outputOptions = outputAlphabet.map((output) => output.symbol);
  const symbolWidth = `${Math.max(
    10,
    ...outputOptions.map((symbol) => symbol.length + 4),
  )}ch`;

  return (
    <tr data-testid="moore-output-row" className="bg-muted/20 border-b">
      <th scope="row" className="min-w-[10rem] border-r p-3 text-left">
        {t("moore-mealy.sim.outputLambda")}
      </th>
      {program.states.map((state, stateIndex) => (
        <MooreOutputCell
          key={state}
          state={state}
          stateIndex={stateIndex}
          output={program.outputs[state]}
          outputOptions={outputOptions}
          symbolWidth={symbolWidth}
          isInitialState={state === program.initialState}
          representation={program.representation}
          onOutputSymbolChange={onOutputSymbolChange}
          onOutputSymbolCreate={onOutputSymbolCreate}
          onOutputSymbolRename={onOutputSymbolRename}
          onOutputCodeChange={onOutputCodeChange}
        />
      ))}
      <td aria-hidden="true" />
    </tr>
  );
}

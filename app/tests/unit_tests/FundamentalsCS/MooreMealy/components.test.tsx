// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { MooreSimulator } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/MooreSimulator";
import { MealySimulator } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/MealySimulator";
import { MooreConfigView } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/MooreConfigView";
import { MealyConfigView } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/MealyConfigView";
import { MooreSimulationView } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/MooreSimulationView";
import { MealySimulationView } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/MealySimulationView";
import { AutomataConversionView } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/AutomataConversionView";
import { AutomataLogicGateView } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/AutomataLogicGateView";
import { FormulaSelectorGrid } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/FormulaSelectorGrid";
import { AutomataInputBuilder } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/AutomataInputBuilder";
import { AutomataFormulaList } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/AutomataFormulaList";
import { AutomataViewActions } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/AutomataViewActions";
import { AutomataSolutionCheckDialog } from "@/pages/FundamentalsCS/MooreMealy/components/AutomataSolutionCheckDialog";
import { MooreTransitionTable } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/MooreTransitionTable";
import { MooreOutputTable } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/MooreOutputTable";
import { defaultMooreProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMooreProgram";
import { defaultMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMealyProgram";
import { buildMooreConversion } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/automataConversion";
import type { MooreRuntime } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mooreTypes";
import type { MealyRuntime } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mealyTypes";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
}));

describe("MooreMealy Presentation & Container Components", () => {
  it("renders MooreConfigView and triggers callbacks", () => {
    const onAddState = vi.fn();
    const onAddInputSymbol = vi.fn();
    render(
      <MooreConfigView
        program={defaultMooreProgram}
        issues={[]}
        onChange={vi.fn()}
        onTransitionChange={vi.fn()}
        onStateRename={vi.fn()}
        onInputSymbolRename={vi.fn()}
        onAddState={onAddState}
        onRemoveState={vi.fn()}
        onAddInputSymbol={onAddInputSymbol}
        onRemoveInputSymbol={vi.fn()}
        onOutputSymbolChange={vi.fn()}
        onOutputSymbolCreate={vi.fn()}
        onOutputCodeChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("moore-config-view")).toBeInTheDocument();
    const addStateBtn = screen.getByTestId("moore-add-state");
    fireEvent.click(addStateBtn);
    expect(onAddState).toHaveBeenCalled();
  });

  it("renders MealyConfigView and handles state interactions", () => {
    const onAddState = vi.fn();
    render(
      <MealyConfigView
        program={defaultMealyProgram}
        issues={[]}
        onChange={vi.fn()}
        onTransitionChange={vi.fn()}
        onStateRename={vi.fn()}
        onInputRename={vi.fn()}
        onAddState={onAddState}
        onRemoveState={vi.fn()}
        onAddInput={vi.fn()}
        onRemoveInput={vi.fn()}
        onOutputSymbolChange={vi.fn()}
        onOutputCodeChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("mealy-config-view")).toBeInTheDocument();
  });

  it("renders MooreSimulationView with controls and runtime info", () => {
    const runtime: MooreRuntime = {
      currentState: defaultMooreProgram.initialState,
      inputPosition: 0,
      outputSymbols: [],
      stepCount: 0,
      halted: false,
      transitionHistory: [],
    };
    render(
      <MooreSimulationView
        program={defaultMooreProgram}
        runtime={runtime}
        status="idle"
        speed={1}
        error={null}
        onEdit={vi.fn()}
        onPlay={vi.fn()}
        onPause={vi.fn()}
        onStep={vi.fn()}
        onStepBack={vi.fn()}
        onReset={vi.fn()}
        onSpeedChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("moore-simulation-view")).toBeInTheDocument();
  });

  it("renders MealySimulationView", () => {
    const runtime: MealyRuntime = {
      currentState: defaultMealyProgram.initialState,
      inputPosition: 0,
      outputSymbols: [],
      stepCount: 0,
      halted: false,
      transitionHistory: [],
    };
    render(
      <MealySimulationView
        program={defaultMealyProgram}
        runtime={runtime}
        status="idle"
        speed={1}
        error={null}
        onPlay={vi.fn()}
        onPause={vi.fn()}
        onStep={vi.fn()}
        onStepBack={vi.fn()}
        onReset={vi.fn()}
        onSpeedChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("mealy-simulation-view")).toBeInTheDocument();
  });

  it("renders AutomataConversionView and switches tabs", () => {
    const conversion = buildMooreConversion(defaultMooreProgram);
    render(
      <AutomataConversionView
        conversion={conversion}
        onBackToEditor={vi.fn()}
        onShowSimulator={vi.fn()}
        onShowLogic={vi.fn()}
      />,
    );

    expect(screen.getByTestId("moore-conversion-view")).toBeInTheDocument();
    const outputTab = screen.getByTestId("moore-conversion-tab-output");
    fireEvent.click(outputTab);
    expect(screen.getByTestId("moore-output-value-table")).toBeInTheDocument();
  });

  it("renders AutomataLogicGateView and selects formulas", () => {
    const conversion = buildMooreConversion(defaultMooreProgram);
    render(
      <AutomataLogicGateView
        conversion={conversion}
        onEditDefinition={vi.fn()}
        onShowSimulator={vi.fn()}
        onShowConversion={vi.fn()}
      />,
    );

    expect(screen.getByTestId("moore-logic-gate-view")).toBeInTheDocument();
  });

  it("renders FormulaSelectorGrid and triggers select callback", () => {
    const onSelect = vi.fn();
    render(
      <FormulaSelectorGrid
        formulas={[{ id: "f1", name: "f1", expression: "a AND b", terms: [] }]}
        selectedId="f1"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByTestId("moore-logic-formula-f1")).toBeInTheDocument();
  });

  it("renders AutomataInputBuilder and adds/removes tokens", () => {
    const onChange = vi.fn();
    render(
      <AutomataInputBuilder
        inputSymbols={["0", "1"]}
        inputWord={["0", "1"]}
        onChange={onChange}
      />,
    );
    expect(screen.getByTestId("moore-input-alphabet")).toBeInTheDocument();
    const token = screen.getByTestId("moore-input-token-0");
    fireEvent.click(token);
    expect(onChange).toHaveBeenCalled();
  });

  it("renders AutomataFormulaList and AutomataViewActions", () => {
    render(
      <AutomataFormulaList
        title="Formulas"
        formulas={[{ id: "f1", name: "f1", expression: "a OR b", terms: [] }]}
      />,
    );
    expect(screen.getByTestId("moore-formula-minimal-f1")).toBeInTheDocument();

    const onAction = vi.fn();
    render(
      <AutomataViewActions
        actions={[
          {
            label: "Action 1",
            onClick: onAction,
            icon: ArrowLeft,
            testId: "test-action-1",
          },
          {
            label: "Action 2",
            onClick: onAction,
            icon: Check,
            testId: "test-action-2",
          },
          {
            label: "Action 3",
            onClick: onAction,
            icon: Sparkles,
            testId: "test-action-3",
          },
        ]}
      />,
    );
    const actionBtn = screen.getByTestId("test-action-1");
    fireEvent.click(actionBtn);
    expect(onAction).toHaveBeenCalled();
  });

  it("renders AutomataSolutionCheckDialog", () => {
    const onClose = vi.fn();
    render(
      <AutomataSolutionCheckDialog
        checkResult={{
          passed: true,
          rows: [
            {
              input: ["0"],
              outputCodes: [0],
              expectedOutputCodes: [0],
              passed: true,
            },
          ],
        }}
        onClose={onClose}
      />,
    );
    expect(
      screen.getByTestId("automata-solution-check-dialog"),
    ).toBeInTheDocument();
  });

  it("renders MooreSimulator and MealySimulator full container workflows", () => {
    render(<MooreSimulator scenario={null} isExample={true} />);
    expect(screen.getByTestId("moore-simulator")).toBeInTheDocument();

    render(<MealySimulator storageEnabled={false} />);
    expect(screen.getByTestId("mealy-simulator")).toBeInTheDocument();
  });

  it("renders MooreTransitionTable and MooreOutputTable", () => {
    render(
      <MooreTransitionTable
        program={defaultMooreProgram}
        representation="decimal"
        onTransitionChange={vi.fn()}
        onStateRename={vi.fn()}
        onInputSymbolRename={vi.fn()}
        onAddState={vi.fn()}
        onRemoveState={vi.fn()}
        onAddInputSymbol={vi.fn()}
        onRemoveInputSymbol={vi.fn()}
      />,
    );
    expect(screen.getByTestId("moore-transition-table")).toBeInTheDocument();

    render(
      <table>
        <tbody>
          <MooreOutputTable
            program={defaultMooreProgram}
            outputAlphabet={defaultMooreProgram.states.map(
              (s) => defaultMooreProgram.outputs[s],
            )}
            representation="decimal"
            onOutputSymbolChange={vi.fn()}
            onOutputSymbolCreate={vi.fn()}
            onOutputCodeChange={vi.fn()}
          />
        </tbody>
      </table>,
    );
    expect(screen.getByTestId("moore-output-row")).toBeInTheDocument();
  });
});

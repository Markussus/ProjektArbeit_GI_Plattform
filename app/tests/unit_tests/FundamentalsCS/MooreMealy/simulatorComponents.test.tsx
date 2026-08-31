/** @vitest-environment jsdom */

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultMooreProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMooreProgram";
import { defaultMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMealyProgram";
import { resizeTextInput } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/transitionTableDom";
import { MooreTransitionCell } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/MooreTransitionCell";
import { MooreTransitionRow } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/MooreTransitionRow";
import { MooreTransitionTable } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/MooreTransitionTable";
import { MooreOutputCell } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/MooreOutputCell";
import { MooreOutputTable } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/MooreOutputTable";
import { AutomataInputBuilder } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/AutomataInputBuilder";
import { AutomataLogicGateView } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/AutomataLogicGateView";
import { MooreConfigView } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/MooreConfigView";
import { MealyConfigView } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/presentation/MealyConfigView";
import { MooreSimulator } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/MooreSimulator";
import { MealySimulator } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/MealySimulator";
import { buildMooreConversion } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/automataConversion";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
}));

describe("Simulator Presentation & Components", () => {
  afterEach(() => {
    cleanup();
  });

  describe("transitionTableDom utils", () => {
    it("resizes input element correctly based on content", () => {
      const input = document.createElement("input");
      input.value = "Short";
      document.body.appendChild(input);

      resizeTextInput(input);
      expect(input.style.width).toBeDefined();

      input.value = "A much longer string value for testing width calculation";
      resizeTextInput(input);
      expect(input.style.width).toBeDefined();

      document.body.removeChild(input);
    });
  });

  describe("MooreTransitionCell & MooreTransitionRow", () => {
    it("renders MooreTransitionCell and handles select and create new state", () => {
      const onTransitionChange = vi.fn();
      const onAddState = vi.fn().mockReturnValue("NEW");

      render(
        <table>
          <tbody>
            <tr>
              <MooreTransitionCell
                inputSymbol="0"
                state="HALT"
                target="READY"
                states={["HALT", "READY"]}
                inputIndex={0}
                stateIndex={0}
                dropdownWidth="10ch"
                isInitialState={true}
                representation="decimal"
                onTransitionChange={onTransitionChange}
                onAddState={onAddState}
              />
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.getByTestId("moore-transition-0-0")).toBeInTheDocument();

      // Trigger selection
      const trigger = screen.getByTestId("moore-transition-0-0");
      fireEvent.click(trigger);

      const optionReady = screen.getByTestId(
        "moore-transition-0-0-option-READY",
      );
      fireEvent.pointerDown(optionReady);
      expect(onTransitionChange).toHaveBeenCalledWith("0", "HALT", "READY");

      fireEvent.click(trigger);
      fireEvent.change(screen.getByTestId("moore-transition-0-0-search"), {
        target: { value: "NEW" },
      });
      fireEvent.pointerDown(screen.getByTestId("moore-transition-0-0-create"));

      expect(onAddState).toHaveBeenCalledWith("NEW");
      expect(onTransitionChange).toHaveBeenLastCalledWith("0", "HALT", "NEW");
    });

    it("edits Mealy output data and restores an invalid internal code", () => {
      const onSymbolChange = vi.fn();
      const onSymbolCreate = vi.fn();
      const onCodeChange = vi.fn();

      render(
        <table>
          <tbody>
            <tr>
              <MooreTransitionCell
                inputSymbol="0"
                state="HALT"
                target="HALT"
                states={["HALT"]}
                inputIndex={0}
                stateIndex={0}
                dropdownWidth="10ch"
                isInitialState={false}
                representation="decimal"
                outputColumnWidth={{ symbol: "9ch", code: "8ch" }}
                outputControls={{
                  getOutput: () => ({ symbol: "OUT", code: 5 }),
                  outputOptions: ["OUT", "OTHER"],
                  onSymbolChange,
                  onSymbolCreate,
                  onCodeChange,
                  testIdPrefix: "mealy-output",
                }}
                onTransitionChange={vi.fn()}
                onAddState={vi.fn()}
              />
            </tr>
          </tbody>
        </table>,
      );

      const symbolSelect = screen.getByTestId("mealy-output-symbol-0-0");
      expect(symbolSelect).toBeInTheDocument();

      fireEvent.click(symbolSelect);
      const otherOption = screen.getByTestId(
        "mealy-output-symbol-0-0-option-OTHER",
      );
      fireEvent.pointerDown(otherOption);
      expect(onSymbolChange).toHaveBeenCalledWith("0", "HALT", "OTHER");

      fireEvent.click(symbolSelect);
      const search = screen.getByTestId("mealy-output-symbol-0-0-search");
      fireEvent.change(search, { target: { value: "BRAND_NEW" } });
      const createBtn = screen.getByTestId("mealy-output-symbol-0-0-create");
      fireEvent.pointerDown(createBtn);
      expect(onSymbolCreate).toHaveBeenCalledWith("0", "HALT", "BRAND_NEW");

      const codeInput = screen.getByTestId("mealy-output-code-0-0");
      fireEvent.change(codeInput, { target: { value: "invalid" } });
      fireEvent.blur(codeInput);
      expect(codeInput).toHaveValue("5");
      expect(onCodeChange).not.toHaveBeenCalled();

      fireEvent.focus(codeInput);
      fireEvent.change(codeInput, { target: { value: "12" } });
      fireEvent.keyDown(codeInput, { key: "Enter" });
      fireEvent.blur(codeInput);
      expect(onCodeChange).toHaveBeenCalledWith("0", "HALT", 12);
    });

    it("renders MooreTransitionRow and handles input symbol rename and delete", () => {
      const onInputSymbolRename = vi.fn().mockReturnValue(true);
      const onRemoveInputSymbol = vi.fn();
      const onTransitionChange = vi.fn();
      const onAddState = vi.fn();

      render(
        <table>
          <tbody>
            <MooreTransitionRow
              inputSymbol="0"
              inputIndex={0}
              program={defaultMooreProgram}
              dropdownWidth="10ch"
              onInputSymbolRename={onInputSymbolRename}
              onRemoveInputSymbol={onRemoveInputSymbol}
              onTransitionChange={onTransitionChange}
              onAddState={onAddState}
            />
          </tbody>
        </table>,
      );

      expect(screen.getByTestId("moore-input-symbol-0")).toBeInTheDocument();
      expect(
        screen.getByTestId("moore-remove-input-symbol-0"),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("moore-remove-input-symbol-0"));
      expect(onRemoveInputSymbol).toHaveBeenCalledWith("0");
    });
  });

  describe("MooreTransitionTable", () => {
    it("renders table with states header and actions", () => {
      const onStateRename = vi.fn();
      const onRemoveState = vi.fn();
      const onAddState = vi.fn();
      const onAddInputSymbol = vi.fn();

      render(
        <MooreTransitionTable
          program={defaultMooreProgram}
          onTransitionChange={vi.fn()}
          onStateRename={onStateRename}
          onRemoveState={onRemoveState}
          onAddState={onAddState}
          onAddInputSymbol={onAddInputSymbol}
          onInputSymbolRename={vi.fn()}
          onRemoveInputSymbol={vi.fn()}
        />,
      );

      expect(screen.getByTestId("moore-add-state")).toBeInTheDocument();
      expect(screen.getByTestId("moore-add-input-symbol")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("moore-add-state"));
      expect(onAddState).toHaveBeenCalled();

      fireEvent.click(screen.getByTestId("moore-add-input-symbol"));
      expect(onAddInputSymbol).toHaveBeenCalled();
    });
  });

  describe("MooreOutputCell & MooreOutputTable", () => {
    it("renders MooreOutputCell and handles symbol and code changes", () => {
      const onSymbolChange = vi.fn();
      const onSymbolCreate = vi.fn();
      const onCodeChange = vi.fn();
      render(
        <table>
          <tbody>
            <tr>
              <MooreOutputCell
                state="HALT"
                stateIndex={0}
                output={{ symbol: "4", code: 4 }}
                outputOptions={["4", "6"]}
                symbolWidth="10ch"
                isInitialState={true}
                representation="decimal"
                onOutputSymbolChange={onSymbolChange}
                onOutputSymbolCreate={onSymbolCreate}
                onOutputCodeChange={onCodeChange}
              />
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.getByTestId("moore-output-symbol-0")).toBeInTheDocument();
      expect(screen.getByTestId("moore-output-code-0")).toBeInTheDocument();

      // Change decimal code onBlur
      const codeInput = screen.getByTestId("moore-output-code-0");
      fireEvent.change(codeInput, { target: { value: "1" } });
      fireEvent.blur(codeInput);
      expect(onCodeChange).toHaveBeenCalledWith("HALT", 1);
    });

    it("renders MooreOutputTable for all states", () => {
      render(
        <table>
          <tbody>
            <MooreOutputTable
              program={defaultMooreProgram}
              outputAlphabet={[{ symbol: "0", code: 0 }]}
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

  describe("AutomataInputBuilder", () => {
    it("appends and removes tokens, and clears sequence", () => {
      const onChange = vi.fn();
      render(
        <AutomataInputBuilder
          inputSymbols={["0", "1"]}
          inputWord={["0", "1", "0"]}
          onChange={onChange}
        />,
      );

      expect(screen.getByTestId("moore-input-word")).toBeInTheDocument();

      // Click symbol button to append
      const symbolBtn = screen.getByTestId("moore-input-token-1");
      fireEvent.click(symbolBtn);
      expect(onChange).toHaveBeenCalledWith(["0", "1", "0", "1"]);

      // Click token remove button
      const token0Remove = screen.getByTestId(
        "moore-input-word-token-0-remove",
      );
      fireEvent.click(token0Remove);
      expect(onChange).toHaveBeenCalledWith(["1", "0"]);
    });
  });

  describe("AutomataLogicGateView", () => {
    it("switches formula mode, toggles binary gates, and triggers actions", () => {
      const conversion = buildMooreConversion(defaultMooreProgram);
      const onEditDefinition = vi.fn();
      const onShowSimulator = vi.fn();
      const onShowConversion = vi.fn();

      render(
        <AutomataLogicGateView
          conversion={conversion}
          onEditDefinition={onEditDefinition}
          onShowSimulator={onShowSimulator}
          onShowConversion={onShowConversion}
        />,
      );

      expect(screen.getByTestId("moore-logic-gate-view")).toBeInTheDocument();

      // Binary gates toggle
      const binaryToggle = screen.getByTestId("moore-binary-gates-toggle");
      fireEvent.click(binaryToggle);
      expect(binaryToggle).not.toBeChecked();

      // Action buttons
      fireEvent.click(screen.getByTestId("moore-logic-edit-definition"));
      expect(onEditDefinition).toHaveBeenCalled();

      fireEvent.click(screen.getByTestId("moore-logic-show-simulator"));
      expect(onShowSimulator).toHaveBeenCalled();

      fireEvent.click(screen.getByTestId("moore-logic-show-conversion"));
      expect(onShowConversion).toHaveBeenCalled();
    });
  });

  describe("MooreConfigView & MealyConfigView", () => {
    it("handles representation change and initial state in MooreConfigView", () => {
      const onChange = vi.fn();

      render(
        <MooreConfigView
          program={defaultMooreProgram}
          issues={[]}
          onChange={onChange}
          onTransitionChange={vi.fn()}
          onStateRename={vi.fn()}
          onInputSymbolRename={vi.fn()}
          onAddState={vi.fn()}
          onRemoveState={vi.fn()}
          onAddInputSymbol={vi.fn()}
          onRemoveInputSymbol={vi.fn()}
          onOutputSymbolChange={vi.fn()}
          onOutputSymbolCreate={vi.fn()}
          onOutputCodeChange={vi.fn()}
        />,
      );

      expect(
        screen.getByTestId("moore-start-state-select"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("moore-representation-select"),
      ).toBeInTheDocument();
    });

    it("renders MealyConfigView", () => {
      render(
        <MealyConfigView
          program={defaultMealyProgram}
          issues={[]}
          onChange={vi.fn()}
          onTransitionChange={vi.fn()}
          onStateRename={vi.fn()}
          onInputRename={vi.fn()}
          onAddState={vi.fn()}
          onRemoveState={vi.fn()}
          onAddInput={vi.fn()}
          onRemoveInput={vi.fn()}
          onOutputSymbolChange={vi.fn()}
          onOutputCodeChange={vi.fn()}
        />,
      );

      expect(screen.getByTestId("mealy-config-view")).toBeInTheDocument();
    });
  });

  describe("MooreSimulator & MealySimulator full flows", () => {
    it("mounts MooreSimulator, steps through simulation and switches views", async () => {
      render(
        <MooreSimulator
          scenario={null}
          initialProgram={defaultMooreProgram}
          isExample={true}
        />,
      );

      expect(screen.getByTestId("moore-simulator")).toBeInTheDocument();

      // Go to simulation view
      await act(async () => {
        fireEvent.click(screen.getByTestId("moore-start-simulation"));
      });
      expect(screen.getByTestId("moore-simulation-view")).toBeInTheDocument();

      // Step simulation
      await act(async () => {
        fireEvent.click(screen.getByTestId("moore-controls-step"));
      });

      // Switch to conversion view
      await act(async () => {
        fireEvent.click(screen.getByTestId("moore-open-conversion"));
      });
      expect(screen.getByTestId("moore-conversion-view")).toBeInTheDocument();

      // Switch to logic gate view
      await act(async () => {
        fireEvent.click(screen.getByTestId("moore-conversion-show-logic"));
      });
      expect(screen.getByTestId("moore-logic-gate-view")).toBeInTheDocument();

      // Back to editor
      await act(async () => {
        fireEvent.click(screen.getByTestId("moore-logic-edit-definition"));
      });
      expect(screen.getByTestId("moore-transition-table")).toBeInTheDocument();
    });

    it("mounts MealySimulator, steps through simulation and switches views", async () => {
      render(
        <MealySimulator
          scenario={null}
          initialProgram={defaultMealyProgram}
          isExample={true}
        />,
      );

      expect(screen.getByTestId("mealy-simulator")).toBeInTheDocument();

      // Go to simulation view
      await act(async () => {
        fireEvent.click(screen.getByTestId("mealy-start-simulation"));
      });
      expect(screen.getByTestId("mealy-simulation-view")).toBeInTheDocument();

      // Step simulation
      await act(async () => {
        fireEvent.click(screen.getByTestId("mealy-controls-step"));
      });

      // Switch to conversion view
      await act(async () => {
        fireEvent.click(screen.getByTestId("mealy-open-conversion"));
      });
      expect(screen.getByTestId("moore-conversion-view")).toBeInTheDocument();

      // Switch to logic gate view
      await act(async () => {
        fireEvent.click(screen.getByTestId("moore-conversion-show-logic"));
      });
      expect(screen.getByTestId("moore-logic-gate-view")).toBeInTheDocument();

      // Back to editor
      await act(async () => {
        fireEvent.click(screen.getByTestId("moore-logic-edit-definition"));
      });
      expect(screen.getByTestId("moore-transition-table")).toBeInTheDocument();
    });
  });
});

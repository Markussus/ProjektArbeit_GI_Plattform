import { Binary, Eraser, Plus, ToggleLeft } from "lucide-react";
import type {
  ExampleDefinition,
  ExerciseDefinition,
  ExerciseDifficulty,
} from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";
import {
  withDerivedAlphabets,
  type TMProgram,
} from "../components/Simulator/domain/tmProgram";
import { DEFAULT_BLANK_SYMBOL } from "../components/Simulator/domain/tmTypes";

export interface TMValidationCase {
  input: string;
  expectedOutput: string;
}

interface TMScenarioBase {
  id: TranslationKey;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  program: TMProgram;
}

export interface TuringMachineExerciseScenario extends TMScenarioBase {
  kind: "exercise";
  starterProgram: TMProgram;
  solutionProgram: TMProgram;
  validationCases: TMValidationCase[];
  definition: ExerciseDefinition;
}

export interface TuringMachineExampleScenario extends TMScenarioBase {
  kind: "example";
  definition: ExampleDefinition;
}

export type TuringMachineScenario =
  | TuringMachineExerciseScenario
  | TuringMachineExampleScenario;

const exerciseDifficultyOrder: Record<ExerciseDifficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

export const emptyTuringMachineProgram = createProgram({
  states: ["q0", "qS"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: [],
  transitions: {},
});

const bitFlipProgram = createProgram({
  states: ["q0", "qS"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: "101001".split(""),
  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "N" },
    },
    "0": {
      q0: { nextState: "q0", writeSymbol: "1", movement: "R" },
    },
    "1": {
      q0: { nextState: "q0", writeSymbol: "0", movement: "R" },
    },
  },
});

const unaryIncrementProgram = createProgram({
  states: ["q0", "qS"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "1"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: "111".split(""),
  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: { nextState: "qS", writeSymbol: "1", movement: "N" },
    },
    "1": {
      q0: { nextState: "q0", writeSymbol: "1", movement: "R" },
    },
  },
});

const binaryIncrementProgram = createProgram({
  states: ["q0", "q1", "q2", "qS"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: "1101".split(""),
  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: { nextState: "q1", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
      q1: { nextState: "q2", writeSymbol: "1", movement: "R" },
      q2: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "N" },
    },
    "0": {
      q0: { nextState: "q0", writeSymbol: "0", movement: "R" },
      q1: { nextState: "q2", writeSymbol: "1", movement: "R" },
      q2: { nextState: "q2", writeSymbol: "0", movement: "R" },
    },
    "1": {
      q0: { nextState: "q0", writeSymbol: "1", movement: "R" },
      q1: { nextState: "q1", writeSymbol: "0", movement: "L" },
      q2: { nextState: "q2", writeSymbol: "1", movement: "R" },
    },
  },
});

const eraseTapeProgram = createProgram({
  states: ["q0", "qS"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: "10110".split(""),
  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "N" },
    },
    "0": {
      q0: { nextState: "q0", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "R" },
    },
    "1": {
      q0: { nextState: "q0", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "R" },
    },
  },
});

const duplicateZeros = createProgram({
  states: ["q0", "q1", "q2", "q3", "q4", "q5", "qS"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1", "X", "Y"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: "1001".split(""),

  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q3: { nextState: "q4", writeSymbol: "1", movement: "L" },
    },

    "0": {
      q1: { nextState: "q2", writeSymbol: "X", movement: "R" },
      q2: { nextState: "q2", writeSymbol: "0", movement: "R" },
      q4: { nextState: "q4", writeSymbol: "0", movement: "L" },
      q5: { nextState: "q5", writeSymbol: "0", movement: "L" },
    },

    "1": {
      q0: { nextState: "q1", writeSymbol: "1", movement: "R" },
      q1: { nextState: "q5", writeSymbol: "1", movement: "L" },
      q2: { nextState: "q3", writeSymbol: "Y", movement: "R" },
      q4: { nextState: "q1", writeSymbol: "1", movement: "R" },
      q5: { nextState: "qS", writeSymbol: "1", movement: "N" },
    },

    X: {
      q1: { nextState: "q1", writeSymbol: "X", movement: "R" },
      q2: { nextState: "q2", writeSymbol: "X", movement: "R" },
      q4: { nextState: "q4", writeSymbol: "X", movement: "L" },
      q5: { nextState: "q5", writeSymbol: "0", movement: "L" },
    },

    Y: {
      q1: { nextState: "q1", writeSymbol: "Y", movement: "R" },
      q2: { nextState: "q2", writeSymbol: "Y", movement: "R" },
      q4: { nextState: "q4", writeSymbol: "Y", movement: "L" },
      q5: { nextState: "q5", writeSymbol: "0", movement: "L" },
    },
  },
});

const addBinary = createProgram({
  states: ["q0", "q1", "q2", "q3", "q4", "q5", "q6", "q7", "qS"],

  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1", "+"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: "101+11".split(""),

  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q1: { nextState: "q7", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
      q2: { nextState: "q3", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
      q5: { nextState: "q6", writeSymbol: "1", movement: "R" },
    },

    "0": {
      q0: { nextState: "q0", writeSymbol: "0", movement: "R" },
      q1: { nextState: "q1", writeSymbol: "0", movement: "R" },
      q2: { nextState: "q2", writeSymbol: "0", movement: "R" },
      q3: { nextState: "q3", writeSymbol: "1", movement: "L" },
      q4: { nextState: "q4", writeSymbol: "0", movement: "L" },
      q5: { nextState: "q6", writeSymbol: "1", movement: "R" },
      q6: { nextState: "q6", writeSymbol: "0", movement: "R" },
      q7: { nextState: "q7", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
    },

    "1": {
      q0: { nextState: "q0", writeSymbol: "1", movement: "R" },
      q1: { nextState: "q2", writeSymbol: "1", movement: "R" },
      q2: { nextState: "q2", writeSymbol: "1", movement: "R" },
      q3: { nextState: "q4", writeSymbol: "0", movement: "L" },
      q4: { nextState: "q4", writeSymbol: "1", movement: "L" },
      q5: { nextState: "q5", writeSymbol: "0", movement: "L" },
      q6: { nextState: "q6", writeSymbol: "1", movement: "R" },
      q7: { nextState: "q7", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
    },

    "+": {
      q0: { nextState: "q1", writeSymbol: "+", movement: "R" },
      q4: { nextState: "q5", writeSymbol: "+", movement: "L" },
      q6: { nextState: "q1", writeSymbol: "+", movement: "R" },
      q7: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "N" },
    },
  },
});

const checkRegex = createProgram({
  states: ["q0", "qA0", "qA1", "qB0", "qB1", "q3", "q4", "q5", "qS"],

  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1", "t", "f"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: "11001".split(""),

  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: { nextState: "qS", writeSymbol: "f", movement: "N" },
      qA1: {
        nextState: "q4",
        writeSymbol: DEFAULT_BLANK_SYMBOL,
        movement: "L",
      },
      qA0: {
        nextState: "q5",
        writeSymbol: DEFAULT_BLANK_SYMBOL,
        movement: "L",
      },
      qB0: {
        nextState: "q4",
        writeSymbol: DEFAULT_BLANK_SYMBOL,
        movement: "L",
      },
      qB1: {
        nextState: "q5",
        writeSymbol: DEFAULT_BLANK_SYMBOL,
        movement: "L",
      },
      q3: { nextState: "q5", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
      q4: { nextState: "qS", writeSymbol: "t", movement: "N" },
      q5: { nextState: "qS", writeSymbol: "f", movement: "N" },
    },

    "0": {
      q0: { nextState: "qB0", writeSymbol: "0", movement: "R" },
      qA1: { nextState: "qA0", writeSymbol: "0", movement: "R" },
      qA0: { nextState: "q3", writeSymbol: "0", movement: "R" },
      qB0: { nextState: "q3", writeSymbol: "0", movement: "R" },
      qB1: { nextState: "qB0", writeSymbol: "0", movement: "R" },
      q3: { nextState: "q3", writeSymbol: "0", movement: "R" },
      q4: { nextState: "q4", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
      q5: { nextState: "q5", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
    },

    "1": {
      q0: { nextState: "qA1", writeSymbol: "1", movement: "R" },
      qA1: { nextState: "q3", writeSymbol: "1", movement: "R" },
      qA0: { nextState: "qA1", writeSymbol: "1", movement: "R" },
      qB0: { nextState: "qB1", writeSymbol: "1", movement: "R" },
      qB1: { nextState: "q3", writeSymbol: "1", movement: "R" },
      q3: { nextState: "q3", writeSymbol: "1", movement: "R" },
      q4: { nextState: "q4", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
      q5: { nextState: "q5", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
    },
  },
});

const worksheetAlternatingSymbols = createProgram({
  states: ["q0", "q1", "q2", "qS"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: "0101".split(""),

  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "R" },
      q1: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "R" },
      q2: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "R" },
    },

    "0": {
      q0: { nextState: "q2", writeSymbol: "0", movement: "R" },
      q1: { nextState: "q2", writeSymbol: "0", movement: "R" },
      q2: { nextState: "qS", writeSymbol: "0", movement: "R" },
    },

    "1": {
      q0: { nextState: "q1", writeSymbol: "1", movement: "R" },
      q1: { nextState: "qS", writeSymbol: "1", movement: "R" },
      q2: { nextState: "q1", writeSymbol: "1", movement: "R" },
    },
  },
});

const worksheetSwapFirstTwoSymbols = createProgram({
  states: ["q0", "q1", "q2", "q3", "q4", "qS"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: "10010".split(""),

  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "R" },
      q1: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "R" },
      q2: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "R" },
      q3: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "R" },
      q4: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "R" },
    },

    "0": {
      q0: { nextState: "q1", writeSymbol: "0", movement: "R" },
      q1: { nextState: "qS", writeSymbol: "0", movement: "R" },
      q2: { nextState: "q3", writeSymbol: "1", movement: "L" },
      q3: { nextState: "q4", writeSymbol: "1", movement: "R" },
      q4: { nextState: "qS", writeSymbol: "0", movement: "R" },
    },

    "1": {
      q0: { nextState: "q2", writeSymbol: "1", movement: "R" },
      q1: { nextState: "q3", writeSymbol: "0", movement: "L" },
      q2: { nextState: "qS", writeSymbol: "1", movement: "R" },
      q3: { nextState: "q4", writeSymbol: "0", movement: "R" },
      q4: { nextState: "qS", writeSymbol: "1", movement: "R" },
    },
  },
});

const worksheetSetFirstAndLastToOne = createProgram({
  states: ["q0", "q1", "q2", "q3", "qS"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: "0011010".split(""),

  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "R" },
      q1: { nextState: "q2", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
      q2: { nextState: "q3", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "R" },
      q3: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
    },

    "0": {
      q0: { nextState: "q1", writeSymbol: "1", movement: "R" },
      q1: { nextState: "q1", writeSymbol: "0", movement: "R" },
      q2: { nextState: "q3", writeSymbol: "1", movement: "R" },
      q3: { nextState: "qS", writeSymbol: "0", movement: "R" },
    },

    "1": {
      q0: { nextState: "q1", writeSymbol: "1", movement: "R" },
      q1: { nextState: "q1", writeSymbol: "1", movement: "R" },
      q2: { nextState: "q3", writeSymbol: "1", movement: "R" },
      q3: { nextState: "qS", writeSymbol: "1", movement: "R" },
    },
  },
});

const worksheetAlternatingOverwrite = createProgram({
  states: ["q0", "q1", "qS"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: "110110".split(""),

  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
      q1: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
    },

    "0": {
      q0: { nextState: "q1", writeSymbol: "0", movement: "R" },
      q1: { nextState: "q0", writeSymbol: "1", movement: "R" },
    },

    "1": {
      q0: { nextState: "q1", writeSymbol: "0", movement: "R" },
      q1: { nextState: "q0", writeSymbol: "1", movement: "R" },
    },
  },
});

const worksheetOverwriteLastTwoWithZero = createProgram({
  states: ["q0", "q1", "q2", "qS"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: "0111".split(""),

  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: { nextState: "q1", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
      q1: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "R" },
      q2: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
    },

    "0": {
      q0: { nextState: "q0", writeSymbol: "0", movement: "R" },
      q1: { nextState: "q2", writeSymbol: "0", movement: "L" },
      q2: { nextState: "q2", writeSymbol: "0", movement: "R" },
    },

    "1": {
      q0: { nextState: "q0", writeSymbol: "1", movement: "R" },
      q1: { nextState: "q2", writeSymbol: "1", movement: "L" },
      q2: { nextState: "q2", writeSymbol: "0", movement: "R" },
    },
  },
});

const worksheetAsciiParityBit = createProgram({
  states: ["q0", "q1", "q2", "q3", "q4", "q5", "qS"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: "0111001".split(""),

  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: { nextState: "q2", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
      q1: { nextState: "q3", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
      q2: { nextState: "q4", writeSymbol: "0", movement: "R" },
      q3: { nextState: "q4", writeSymbol: "1", movement: "R" },
      q4: { nextState: "q5", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "R" },
      q5: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "L" },
    },

    "0": {
      q0: { nextState: "q0", writeSymbol: "0", movement: "R" },
      q1: { nextState: "q1", writeSymbol: "0", movement: "R" },
      q2: { nextState: "q2", writeSymbol: "0", movement: "L" },
      q3: { nextState: "q3", writeSymbol: "0", movement: "L" },
      q4: { nextState: "q4", writeSymbol: "0", movement: "R" },
      q5: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "R" },
    },

    "1": {
      q0: { nextState: "q1", writeSymbol: "1", movement: "R" },
      q1: { nextState: "q0", writeSymbol: "1", movement: "R" },
      q2: { nextState: "q2", writeSymbol: "1", movement: "L" },
      q3: { nextState: "q3", writeSymbol: "1", movement: "L" },
      q4: { nextState: "q4", writeSymbol: "1", movement: "R" },
      q5: { nextState: "qS", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "R" },
    },
  },
});

export const turingMachineExercises: TuringMachineExerciseScenario[] = (
  [
    {
      kind: "exercise",
      id: "tm.exercises.exerciseWorksheetAlternatingSymbols",
      titleKey: "tm.exercises.exerciseWorksheetAlternatingSymbols",
      descriptionKey: "tm.exercises.exerciseWorksheetAlternatingSymbolsDesc",
      starterProgram: emptyTuringMachineProgram,
      solutionProgram: worksheetAlternatingSymbols,
      program: emptyTuringMachineProgram,
      validationCases: [
        { input: "", expectedOutput: "" },
        { input: "0", expectedOutput: "0" },
        { input: "1", expectedOutput: "1" },
        { input: "01", expectedOutput: "01" },
        { input: "10", expectedOutput: "10" },
        { input: "0101", expectedOutput: "0101" },
        { input: "0110", expectedOutput: "0110" },
      ],
      definition: {
        titleKey: "tm.exercises.exerciseWorksheetAlternatingSymbols",
        descriptionKey: "tm.exercises.exerciseWorksheetAlternatingSymbolsDesc",
        difficulty: "easy",
        icon: ToggleLeft,
      },
    },
    {
      kind: "exercise",
      id: "tm.exercises.exerciseWorksheetSwapFirstTwoSymbols",
      titleKey: "tm.exercises.exerciseWorksheetSwapFirstTwoSymbols",
      descriptionKey: "tm.exercises.exerciseWorksheetSwapFirstTwoSymbolsDesc",
      starterProgram: emptyTuringMachineProgram,
      solutionProgram: worksheetSwapFirstTwoSymbols,
      program: emptyTuringMachineProgram,
      validationCases: [
        { input: "", expectedOutput: "" },
        { input: "0", expectedOutput: "0" },
        { input: "1", expectedOutput: "1" },
        { input: "00", expectedOutput: "00" },
        { input: "11", expectedOutput: "11" },
        { input: "01", expectedOutput: "10" },
        { input: "10", expectedOutput: "01" },
        { input: "10010", expectedOutput: "01010" },
        { input: "0111", expectedOutput: "1011" },
      ],
      definition: {
        titleKey: "tm.exercises.exerciseWorksheetSwapFirstTwoSymbols",
        descriptionKey: "tm.exercises.exerciseWorksheetSwapFirstTwoSymbolsDesc",
        difficulty: "medium",
        icon: ToggleLeft,
      },
    },
    {
      kind: "exercise",
      id: "tm.exercises.exerciseWorksheetSetFirstAndLastToOne",
      titleKey: "tm.exercises.exerciseWorksheetSetFirstAndLastToOne",
      descriptionKey: "tm.exercises.exerciseWorksheetSetFirstAndLastToOneDesc",
      starterProgram: emptyTuringMachineProgram,
      solutionProgram: worksheetSetFirstAndLastToOne,
      program: emptyTuringMachineProgram,
      validationCases: [
        { input: "", expectedOutput: "" },
        { input: "0", expectedOutput: "1" },
        { input: "1", expectedOutput: "1" },
        { input: "00", expectedOutput: "11" },
        { input: "01", expectedOutput: "11" },
        { input: "10", expectedOutput: "11" },
        { input: "0011010", expectedOutput: "1011011" },
        { input: "1000", expectedOutput: "1001" },
      ],
      definition: {
        titleKey: "tm.exercises.exerciseWorksheetSetFirstAndLastToOne",
        descriptionKey:
          "tm.exercises.exerciseWorksheetSetFirstAndLastToOneDesc",
        difficulty: "medium",
        icon: Binary,
      },
    },
    {
      kind: "exercise",
      id: "tm.exercises.exerciseWorksheetAlternatingOverwrite",
      titleKey: "tm.exercises.exerciseWorksheetAlternatingOverwrite",
      descriptionKey: "tm.exercises.exerciseWorksheetAlternatingOverwriteDesc",
      starterProgram: emptyTuringMachineProgram,
      solutionProgram: worksheetAlternatingOverwrite,
      program: emptyTuringMachineProgram,
      validationCases: [
        { input: "", expectedOutput: "" },
        { input: "0", expectedOutput: "0" },
        { input: "1", expectedOutput: "0" },
        { input: "11", expectedOutput: "01" },
        { input: "110110", expectedOutput: "010101" },
        { input: "00000", expectedOutput: "01010" },
        { input: "1010101", expectedOutput: "0101010" },
      ],
      definition: {
        titleKey: "tm.exercises.exerciseWorksheetAlternatingOverwrite",
        descriptionKey:
          "tm.exercises.exerciseWorksheetAlternatingOverwriteDesc",
        difficulty: "easy",
        icon: ToggleLeft,
      },
    },
    {
      kind: "exercise",
      id: "tm.exercises.exerciseWorksheetOverwriteLastTwoWithZero",
      titleKey: "tm.exercises.exerciseWorksheetOverwriteLastTwoWithZero",
      descriptionKey:
        "tm.exercises.exerciseWorksheetOverwriteLastTwoWithZeroDesc",
      starterProgram: emptyTuringMachineProgram,
      solutionProgram: worksheetOverwriteLastTwoWithZero,
      program: emptyTuringMachineProgram,
      validationCases: [
        { input: "01", expectedOutput: "00" },
        { input: "11", expectedOutput: "00" },
        { input: "0111", expectedOutput: "0100" },
        { input: "10101", expectedOutput: "10100" },
        { input: "000", expectedOutput: "000" },
        { input: "100", expectedOutput: "100" },
      ],
      definition: {
        titleKey: "tm.exercises.exerciseWorksheetOverwriteLastTwoWithZero",
        descriptionKey:
          "tm.exercises.exerciseWorksheetOverwriteLastTwoWithZeroDesc",
        difficulty: "medium",
        icon: Eraser,
      },
    },
    {
      kind: "exercise",
      id: "tm.exercises.exerciseWorksheetAsciiParityBit",
      titleKey: "tm.exercises.exerciseWorksheetAsciiParityBit",
      descriptionKey: "tm.exercises.exerciseWorksheetAsciiParityBitDesc",
      starterProgram: emptyTuringMachineProgram,
      solutionProgram: worksheetAsciiParityBit,
      program: emptyTuringMachineProgram,
      validationCases: [
        { input: "0111001", expectedOutput: "00111001" },
        { input: "0110001", expectedOutput: "10110001" },
        { input: "0000000", expectedOutput: "00000000" },
        { input: "1111111", expectedOutput: "11111111" },
        { input: "1010101", expectedOutput: "01010101" },
      ],
      definition: {
        titleKey: "tm.exercises.exerciseWorksheetAsciiParityBit",
        descriptionKey: "tm.exercises.exerciseWorksheetAsciiParityBitDesc",
        difficulty: "hard",
        icon: Binary,
      },
    },
    {
      kind: "exercise",
      id: "tm.exercises.exerciseEraseTape",
      titleKey: "tm.exercises.exerciseEraseTape",
      descriptionKey: "tm.exercises.exerciseEraseTapeDesc",
      starterProgram: emptyTuringMachineProgram,
      solutionProgram: eraseTapeProgram,
      program: emptyTuringMachineProgram,
      validationCases: [
        { input: "", expectedOutput: "" },
        { input: "0", expectedOutput: "" },
        { input: "1", expectedOutput: "" },
        { input: "101", expectedOutput: "" },
        { input: "000111", expectedOutput: "" },
      ],
      definition: {
        titleKey: "tm.exercises.exerciseEraseTape",
        descriptionKey: "tm.exercises.exerciseEraseTapeDesc",
        difficulty: "easy",
        icon: Eraser,
      },
    },
    {
      kind: "exercise",
      id: "tm.exercises.exerciseInvertBinaryWord",
      titleKey: "tm.exercises.exerciseInvertBinaryWord",
      descriptionKey: "tm.exercises.exerciseInvertBinaryWordDesc",
      starterProgram: emptyTuringMachineProgram,
      solutionProgram: bitFlipProgram,
      program: emptyTuringMachineProgram,
      validationCases: [
        { input: "", expectedOutput: "" },
        { input: "0", expectedOutput: "1" },
        { input: "1", expectedOutput: "0" },
        { input: "1010", expectedOutput: "0101" },
        { input: "0101", expectedOutput: "1010" },
        { input: "000111", expectedOutput: "111000" },
        { input: "1100101", expectedOutput: "0011010" },
      ],
      definition: {
        titleKey: "tm.exercises.exerciseInvertBinaryWord",
        descriptionKey: "tm.exercises.exerciseInvertBinaryWordDesc",
        difficulty: "easy",
        icon: ToggleLeft,
      },
    },
    {
      kind: "exercise",
      id: "tm.exercises.exerciseUnaryIncrement",
      titleKey: "tm.exercises.exerciseUnaryIncrement",
      descriptionKey: "tm.exercises.exerciseUnaryIncrementDesc",
      starterProgram: emptyTuringMachineProgram,
      solutionProgram: unaryIncrementProgram,
      program: emptyTuringMachineProgram,
      validationCases: [
        { input: "", expectedOutput: "1" },
        { input: "1", expectedOutput: "11" },
        { input: "11", expectedOutput: "111" },
        { input: "1111", expectedOutput: "11111" },
        { input: "111111", expectedOutput: "1111111" },
      ],
      definition: {
        titleKey: "tm.exercises.exerciseUnaryIncrement",
        descriptionKey: "tm.exercises.exerciseUnaryIncrementDesc",
        difficulty: "easy",
        icon: Plus,
      },
    },
    {
      kind: "exercise",
      id: "tm.exercises.exerciseDuplicateZeros",
      titleKey: "tm.exercises.exerciseDuplicateZeros",
      descriptionKey: "tm.exercises.exerciseDuplicateZerosDesc",
      starterProgram: emptyTuringMachineProgram,
      solutionProgram: duplicateZeros,
      program: emptyTuringMachineProgram,
      validationCases: [
        { input: "11", expectedOutput: "11" },
        { input: "101", expectedOutput: "1001" },
        { input: "1001", expectedOutput: "100001" },
        { input: "10001", expectedOutput: "10000001" },
        { input: "100001", expectedOutput: "1000000001" },
      ],
      definition: {
        titleKey: "tm.exercises.exerciseDuplicateZeros",
        descriptionKey: "tm.exercises.exerciseDuplicateZerosDesc",
        difficulty: "medium",
        icon: Plus,
      },
    },
    {
      kind: "exercise",
      id: "tm.exercises.exerciseBinaryIncrement",
      titleKey: "tm.exercises.exerciseBinaryIncrement",
      descriptionKey: "tm.exercises.exerciseBinaryIncrementDesc",
      starterProgram: emptyTuringMachineProgram,
      solutionProgram: binaryIncrementProgram,
      program: emptyTuringMachineProgram,
      validationCases: [
        { input: "0", expectedOutput: "1" },
        { input: "1", expectedOutput: "10" },
        { input: "10", expectedOutput: "11" },
        { input: "1011", expectedOutput: "1100" },
        { input: "1101", expectedOutput: "1110" },
        { input: "111", expectedOutput: "1000" },
        { input: "100111", expectedOutput: "101000" },
      ],
      definition: {
        titleKey: "tm.exercises.exerciseBinaryIncrement",
        descriptionKey: "tm.exercises.exerciseBinaryIncrementDesc",
        difficulty: "hard",
        icon: Binary,
      },
    },
    {
      kind: "exercise",
      id: "tm.exercises.exerciseAddBinary",
      titleKey: "tm.exercises.exerciseAddBinary",
      descriptionKey: "tm.exercises.exerciseAddBinaryDesc",
      starterProgram: emptyTuringMachineProgram,
      solutionProgram: addBinary,
      program: emptyTuringMachineProgram,
      validationCases: [
        { input: "0+0", expectedOutput: "0" },
        { input: "1+0", expectedOutput: "1" },
        { input: "1+1", expectedOutput: "10" },
        { input: "10+1", expectedOutput: "11" },
        { input: "101+11", expectedOutput: "1000" },
        { input: "111+1", expectedOutput: "1000" },
        { input: "1001+10", expectedOutput: "1011" },
      ],
      definition: {
        titleKey: "tm.exercises.exerciseAddBinary",
        descriptionKey: "tm.exercises.exerciseAddBinaryDesc",
        difficulty: "hard",
        icon: Binary,
      },
    },
    {
      kind: "exercise",
      id: "tm.exercises.exerciseCheckRegex",
      titleKey: "tm.exercises.exerciseCheckRegex",
      descriptionKey: "tm.exercises.exerciseCheckRegexDesc",
      starterProgram: emptyTuringMachineProgram,
      solutionProgram: checkRegex,
      program: emptyTuringMachineProgram,
      validationCases: [
        { input: "", expectedOutput: "f" },
        { input: "0", expectedOutput: "t" },
        { input: "1", expectedOutput: "t" },
        { input: "010", expectedOutput: "t" },
        { input: "10101", expectedOutput: "t" },
        { input: "11001", expectedOutput: "f" },
        { input: "1001", expectedOutput: "f" },
      ],
      definition: {
        titleKey: "tm.exercises.exerciseCheckRegex",
        descriptionKey: "tm.exercises.exerciseCheckRegexDesc",
        difficulty: "hard",
        icon: Binary,
      },
    },
  ] satisfies TuringMachineExerciseScenario[]
).sort(compareTuringMachineExercisesByDifficulty);

export const turingMachineExamples: TuringMachineExampleScenario[] = [
  {
    kind: "example",
    id: "tm.examples.example1",
    titleKey: "tm.examples.example1",
    descriptionKey: "tm.examples.example1Desc",
    program: bitFlipProgram,
    definition: {
      titleKey: "tm.examples.example1",
      descriptionKey: "tm.examples.example1Desc",
      icon: ToggleLeft,
    },
  },
  {
    kind: "example",
    id: "tm.examples.example2",
    titleKey: "tm.examples.example2",
    descriptionKey: "tm.examples.example2Desc",
    program: unaryIncrementProgram,
    definition: {
      titleKey: "tm.examples.example2",
      descriptionKey: "tm.examples.example2Desc",
      icon: Plus,
    },
  },
  {
    kind: "example",
    id: "tm.examples.example3",
    titleKey: "tm.examples.example3",
    descriptionKey: "tm.examples.example3Desc",
    program: binaryIncrementProgram,
    definition: {
      titleKey: "tm.examples.example3",
      descriptionKey: "tm.examples.example3Desc",
      icon: Binary,
    },
  },
];

export const turingMachineExerciseDefinitions: ExerciseDefinition[] =
  turingMachineExercises.map((exercise) => exercise.definition);

export const turingMachineExampleDefinitions: ExampleDefinition[] =
  turingMachineExamples.map((example) => example.definition);

const scenarioById = new Map<TranslationKey, TuringMachineScenario>(
  [...turingMachineExercises, ...turingMachineExamples].map((scenario) => [
    scenario.id,
    scenario,
  ]),
);

export function getTuringMachineScenario(
  id: TranslationKey,
): TuringMachineScenario | null {
  return scenarioById.get(id) ?? null;
}

function createProgram(program: Omit<TMProgram, "inputAlphabet">): TMProgram {
  return withDerivedAlphabets({
    ...program,
    inputAlphabet: [],
  });
}

function compareTuringMachineExercisesByDifficulty(
  left: TuringMachineExerciseScenario,
  right: TuringMachineExerciseScenario,
): number {
  return (
    exerciseDifficultyOrder[left.definition.difficulty] -
    exerciseDifficultyOrder[right.definition.difficulty]
  );
}

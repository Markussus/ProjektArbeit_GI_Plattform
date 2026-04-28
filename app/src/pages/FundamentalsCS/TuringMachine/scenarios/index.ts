import { Binary, Eraser, Plus, ToggleLeft } from "lucide-react";
import type { ExampleDefinition, ExerciseDefinition } from "@/types/exercise";
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

export const turingMachineExercises: TuringMachineExerciseScenario[] = [
  {
    kind: "exercise",
    id: "turing.exerciseEraseTape",
    titleKey: "turing.exerciseEraseTape",
    descriptionKey: "turing.exerciseEraseTapeDesc",
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
      titleKey: "turing.exerciseEraseTape",
      descriptionKey: "turing.exerciseEraseTapeDesc",
      difficulty: "easy",
      icon: Eraser,
    },
  },
  {
    kind: "exercise",
    id: "turing.exerciseInvertBinaryWord",
    titleKey: "turing.exerciseInvertBinaryWord",
    descriptionKey: "turing.exerciseInvertBinaryWordDesc",
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
      titleKey: "turing.exerciseInvertBinaryWord",
      descriptionKey: "turing.exerciseInvertBinaryWordDesc",
      difficulty: "easy",
      icon: ToggleLeft,
    },
  },
  {
    kind: "exercise",
    id: "turing.exerciseUnaryIncrement",
    titleKey: "turing.exerciseUnaryIncrement",
    descriptionKey: "turing.exerciseUnaryIncrementDesc",
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
      titleKey: "turing.exerciseUnaryIncrement",
      descriptionKey: "turing.exerciseUnaryIncrementDesc",
      difficulty: "medium",
      icon: Plus,
    },
  },
  {
    kind: "exercise",
    id: "turing.exerciseBinaryIncrement",
    titleKey: "turing.exerciseBinaryIncrement",
    descriptionKey: "turing.exerciseBinaryIncrementDesc",
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
      titleKey: "turing.exerciseBinaryIncrement",
      descriptionKey: "turing.exerciseBinaryIncrementDesc",
      difficulty: "hard",
      icon: Binary,
    },
  },
];

export const turingMachineExamples: TuringMachineExampleScenario[] = [
  {
    kind: "example",
    id: "turing.example1",
    titleKey: "turing.example1",
    descriptionKey: "turing.example1Desc",
    program: bitFlipProgram,
    definition: {
      titleKey: "turing.example1",
      descriptionKey: "turing.example1Desc",
      icon: ToggleLeft,
    },
  },
  {
    kind: "example",
    id: "turing.example2",
    titleKey: "turing.example2",
    descriptionKey: "turing.example2Desc",
    program: unaryIncrementProgram,
    definition: {
      titleKey: "turing.example2",
      descriptionKey: "turing.example2Desc",
      icon: Plus,
    },
  },
  {
    kind: "example",
    id: "turing.example3",
    titleKey: "turing.example3",
    descriptionKey: "turing.example3Desc",
    program: binaryIncrementProgram,
    definition: {
      titleKey: "turing.example3",
      descriptionKey: "turing.example3Desc",
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

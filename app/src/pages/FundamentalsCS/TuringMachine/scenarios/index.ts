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
  states: ["q0", "qH"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qH"],
  initialTape: [],
  transitions: {},
});

const bitFlipProgram = createProgram({
  states: ["q0", "qH"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qH"],
  initialTape: "101001".split(""),
  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: { nextState: "qH", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "N" },
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
  states: ["q0", "qH"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "1"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qH"],
  initialTape: "111".split(""),
  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: { nextState: "qH", writeSymbol: "1", movement: "N" },
    },
    "1": {
      q0: { nextState: "q0", writeSymbol: "1", movement: "R" },
    },
  },
});

const binaryIncrementProgram = createProgram({
  states: ["q0", "qCarry", "qH"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qH"],
  initialTape: "1011".split(""),
  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: {
        nextState: "qCarry",
        writeSymbol: DEFAULT_BLANK_SYMBOL,
        movement: "L",
      },
      qCarry: { nextState: "qH", writeSymbol: "1", movement: "N" },
    },
    "0": {
      qCarry: { nextState: "qH", writeSymbol: "1", movement: "N" },
    },
    "1": {
      q0: { nextState: "q0", writeSymbol: "1", movement: "R" },
      qCarry: { nextState: "qCarry", writeSymbol: "0", movement: "L" },
    },
  },
});

const eraseTapeProgram = createProgram({
  states: ["q0", "qH"],
  tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qH"],
  initialTape: "10110".split(""),
  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: { nextState: "qH", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "N" },
    },
    "0": {
      q0: {
        nextState: "q0",
        writeSymbol: DEFAULT_BLANK_SYMBOL,
        movement: "R",
      },
    },
    "1": {
      q0: {
        nextState: "q0",
        writeSymbol: DEFAULT_BLANK_SYMBOL,
        movement: "R",
      },
    },
  },
});

export const turingMachineExercises: TuringMachineExerciseScenario[] = [
  {
    kind: "exercise",
    id: "turing.exercise1",
    titleKey: "turing.exercise1",
    descriptionKey: "turing.exercise1Desc",
    starterProgram: emptyTuringMachineProgram,
    solutionProgram: bitFlipProgram,
    program: emptyTuringMachineProgram,
    validationCases: [
      { input: "", expectedOutput: "" },
      { input: "0", expectedOutput: "1" },
      { input: "1", expectedOutput: "0" },
      { input: "1010", expectedOutput: "0101" },
      { input: "000111", expectedOutput: "111000" },
      { input: "1100101", expectedOutput: "0011010" },
    ],
    definition: {
      titleKey: "turing.exercise1",
      descriptionKey: "turing.exercise1Desc",
      difficulty: "easy",
      icon: ToggleLeft,
    },
  },
  {
    kind: "exercise",
    id: "turing.exercise2",
    titleKey: "turing.exercise2",
    descriptionKey: "turing.exercise2Desc",
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
      titleKey: "turing.exercise2",
      descriptionKey: "turing.exercise2Desc",
      difficulty: "medium",
      icon: Plus,
    },
  },
  {
    kind: "exercise",
    id: "turing.exercise3",
    titleKey: "turing.exercise3",
    descriptionKey: "turing.exercise3Desc",
    starterProgram: emptyTuringMachineProgram,
    solutionProgram: binaryIncrementProgram,
    program: emptyTuringMachineProgram,
    validationCases: [
      { input: "0", expectedOutput: "1" },
      { input: "1", expectedOutput: "10" },
      { input: "10", expectedOutput: "11" },
      { input: "1011", expectedOutput: "1100" },
      { input: "111", expectedOutput: "1000" },
      { input: "100111", expectedOutput: "101000" },
    ],
    definition: {
      titleKey: "turing.exercise3",
      descriptionKey: "turing.exercise3Desc",
      difficulty: "hard",
      icon: Binary,
    },
  },
  {
    kind: "exercise",
    id: "turing.exercise4",
    titleKey: "turing.exercise4",
    descriptionKey: "turing.exercise4Desc",
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
      titleKey: "turing.exercise4",
      descriptionKey: "turing.exercise4Desc",
      difficulty: "medium",
      icon: Eraser,
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

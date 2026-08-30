import { BadgeCheck, Binary, ScanLine, ShieldCheck } from "lucide-react";
import type { MealyProgram } from "../components/Simulator/domain/mealyTypes";
import type { MealyExerciseScenario } from "./exerciseTypes";

const edgeDetectorSolution: MealyProgram = {
  states: ["LOW", "HIGH"],
  inputSymbols: ["0", "1"],
  transitions: {
    "0": { LOW: "LOW", HIGH: "LOW" },
    "1": { LOW: "HIGH", HIGH: "HIGH" },
  },
  outputs: {
    "0": {
      LOW: { symbol: "NO_PULSE", code: 0 },
      HIGH: { symbol: "NO_PULSE", code: 0 },
    },
    "1": {
      LOW: { symbol: "RISING_EDGE", code: 1 },
      HIGH: { symbol: "NO_PULSE", code: 0 },
    },
  },
  initialState: "LOW",
  inputWord: [],
  representation: "binary",
};

const doorControllerSolution: MealyProgram = {
  states: ["LOCKED", "UNLOCKED"],
  inputSymbols: ["CARD", "PASS"],
  transitions: {
    CARD: { LOCKED: "UNLOCKED", UNLOCKED: "UNLOCKED" },
    PASS: { LOCKED: "LOCKED", UNLOCKED: "LOCKED" },
  },
  outputs: {
    CARD: {
      LOCKED: { symbol: "UNLOCK_PULSE", code: 1 },
      UNLOCKED: { symbol: "NO_ACTION", code: 0 },
    },
    PASS: {
      LOCKED: { symbol: "NO_ACTION", code: 0 },
      UNLOCKED: { symbol: "LOCK_PULSE", code: 2 },
    },
  },
  initialState: "LOCKED",
  inputWord: [],
  representation: "binary",
};

const sequenceDetectorSolution: MealyProgram = {
  states: ["WAITING", "SEEN_0"],
  inputSymbols: ["0", "1"],
  transitions: {
    "0": { WAITING: "SEEN_0", SEEN_0: "SEEN_0" },
    "1": { WAITING: "WAITING", SEEN_0: "WAITING" },
  },
  outputs: {
    "0": {
      WAITING: { symbol: "NO_MATCH", code: 0 },
      SEEN_0: { symbol: "NO_MATCH", code: 0 },
    },
    "1": {
      WAITING: { symbol: "NO_MATCH", code: 0 },
      SEEN_0: { symbol: "MATCH_01", code: 1 },
    },
  },
  initialState: "WAITING",
  inputWord: [],
  representation: "binary",
};

const parityTrackerSolution: MealyProgram = {
  states: ["EVEN", "ODD"],
  inputSymbols: ["0", "1"],
  transitions: {
    "0": { EVEN: "EVEN", ODD: "ODD" },
    "1": { EVEN: "ODD", ODD: "EVEN" },
  },
  outputs: {
    "0": {
      EVEN: { symbol: "EVEN_PARITY", code: 0 },
      ODD: { symbol: "ODD_PARITY", code: 1 },
    },
    "1": {
      EVEN: { symbol: "ODD_PARITY", code: 1 },
      ODD: { symbol: "EVEN_PARITY", code: 0 },
    },
  },
  initialState: "EVEN",
  inputWord: [],
  representation: "binary",
};

export const mealyExerciseScenarios: MealyExerciseScenario[] = [
  {
    machineType: "mealy",
    id: "moore-mealy.exercises.edgeDetector.title",
    storageId: 0x37,
    starterProgram: createEmptyExerciseProgram(),
    solutionProgram: edgeDetectorSolution,
    validationCases: [
      { input: [], expectedOutputCodes: [] },
      { input: ["0"], expectedOutputCodes: [0] },
      { input: ["1"], expectedOutputCodes: [1] },
      { input: ["1", "1"], expectedOutputCodes: [1, 0] },
      { input: ["1", "0", "1"], expectedOutputCodes: [1, 0, 1] },
    ],
    definition: {
      titleKey: "moore-mealy.exercises.edgeDetector.title",
      descriptionKey: "moore-mealy.exercises.edgeDetector.description",
      difficulty: "easy",
      icon: ScanLine,
    },
  },
  {
    machineType: "mealy",
    id: "moore-mealy.exercises.doorController.title",
    storageId: 0x38,
    starterProgram: createEmptyExerciseProgram(),
    solutionProgram: doorControllerSolution,
    validationCases: [
      { input: [], expectedOutputCodes: [] },
      { input: ["PASS"], expectedOutputCodes: [0] },
      { input: ["CARD"], expectedOutputCodes: [1] },
      { input: ["CARD", "CARD"], expectedOutputCodes: [1, 0] },
      { input: ["CARD", "PASS"], expectedOutputCodes: [1, 2] },
      { input: ["CARD", "PASS", "PASS"], expectedOutputCodes: [1, 2, 0] },
    ],
    definition: {
      titleKey: "moore-mealy.exercises.doorController.title",
      descriptionKey: "moore-mealy.exercises.doorController.description",
      difficulty: "medium",
      icon: ShieldCheck,
    },
  },
  {
    machineType: "mealy",
    id: "moore-mealy.exercises.sequenceDetector.title",
    storageId: 0x39,
    starterProgram: createEmptyExerciseProgram(),
    solutionProgram: sequenceDetectorSolution,
    validationCases: [
      { input: [], expectedOutputCodes: [] },
      { input: ["1"], expectedOutputCodes: [0] },
      { input: ["0", "1"], expectedOutputCodes: [0, 1] },
      { input: ["0", "0", "1"], expectedOutputCodes: [0, 0, 1] },
      { input: ["0", "1", "0", "1"], expectedOutputCodes: [0, 1, 0, 1] },
    ],
    definition: {
      titleKey: "moore-mealy.exercises.sequenceDetector.title",
      descriptionKey: "moore-mealy.exercises.sequenceDetector.description",
      difficulty: "medium",
      icon: BadgeCheck,
    },
  },
  {
    machineType: "mealy",
    id: "moore-mealy.exercises.parityTracker.title",
    storageId: 0x3a,
    starterProgram: createEmptyExerciseProgram(),
    solutionProgram: parityTrackerSolution,
    validationCases: [
      { input: [], expectedOutputCodes: [] },
      { input: ["0"], expectedOutputCodes: [0] },
      { input: ["1"], expectedOutputCodes: [1] },
      { input: ["1", "1"], expectedOutputCodes: [1, 0] },
      { input: ["1", "0", "1", "1"], expectedOutputCodes: [1, 1, 0, 1] },
    ],
    definition: {
      titleKey: "moore-mealy.exercises.parityTracker.title",
      descriptionKey: "moore-mealy.exercises.parityTracker.description",
      difficulty: "hard",
      icon: Binary,
    },
  },
];

export const mealyExercises = mealyExerciseScenarios.map(
  (scenario) => scenario.definition,
);

function createEmptyExerciseProgram(): MealyProgram {
  return {
    states: ["STATE_0"],
    inputSymbols: [],
    transitions: {},
    outputs: {},
    initialState: "STATE_0",
    inputWord: [],
    representation: "binary",
  };
}

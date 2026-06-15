import {
  BellRing,
  Building2,
  Car,
  Coffee,
  DoorOpen,
  Gauge,
  Waves,
} from "lucide-react";
import type { ExerciseDefinition } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";
import type { MooreProgram } from "../components/Simulator/domain/mooreTypes";

export interface MooreExerciseScenario {
  id: TranslationKey;
  storageId: number;
  starterProgram: MooreProgram;
  solutionProgram: MooreProgram;
  validationCases: MooreValidationCase[];
  definition: ExerciseDefinition;
}

export interface MooreValidationCase {
  input: string[];
  expectedOutputCodes: number[];
}

const turnstileStarter: MooreProgram = {
  states: ["LOCKED", "UNLOCKED"],
  inputSymbols: ["COIN", "PASS"],
  transitions: {
    COIN: { LOCKED: "LOCKED", UNLOCKED: "UNLOCKED" },
    PASS: { LOCKED: "LOCKED", UNLOCKED: "UNLOCKED" },
  },
  outputs: {
    LOCKED: { symbol: "LOCKED", code: 0 },
    UNLOCKED: { symbol: "UNLOCKED", code: 1 },
  },
  initialState: "LOCKED",
  inputWord: [],
  representation: "binary",
};

const turnstileSolution: MooreProgram = {
  ...turnstileStarter,
  transitions: {
    COIN: { LOCKED: "UNLOCKED", UNLOCKED: "UNLOCKED" },
    PASS: { LOCKED: "LOCKED", UNLOCKED: "LOCKED" },
  },
};

const elevatorStarter: MooreProgram = {
  states: ["EG_CLOSED", "EG_OPEN", "OG_CLOSED", "OG_OPEN"],
  inputSymbols: ["OPEN", "CLOSE", "GO_OG", "GO_EG"],
  transitions: {
    OPEN: {
      EG_CLOSED: "EG_CLOSED",
      EG_OPEN: "EG_OPEN",
      OG_CLOSED: "OG_CLOSED",
      OG_OPEN: "OG_OPEN",
    },
    CLOSE: {
      EG_CLOSED: "EG_CLOSED",
      EG_OPEN: "EG_OPEN",
      OG_CLOSED: "OG_CLOSED",
      OG_OPEN: "OG_OPEN",
    },
    GO_OG: {
      EG_CLOSED: "EG_CLOSED",
      EG_OPEN: "EG_OPEN",
      OG_CLOSED: "OG_CLOSED",
      OG_OPEN: "OG_OPEN",
    },
    GO_EG: {
      EG_CLOSED: "EG_CLOSED",
      EG_OPEN: "EG_OPEN",
      OG_CLOSED: "OG_CLOSED",
      OG_OPEN: "OG_OPEN",
    },
  },
  outputs: {
    EG_CLOSED: { symbol: "EG", code: 0 },
    EG_OPEN: { symbol: "EG", code: 0 },
    OG_CLOSED: { symbol: "OG", code: 1 },
    OG_OPEN: { symbol: "OG", code: 1 },
  },
  initialState: "EG_CLOSED",
  inputWord: [],
  representation: "binary",
};

const elevatorSolution: MooreProgram = {
  ...elevatorStarter,
  transitions: {
    OPEN: {
      EG_CLOSED: "EG_OPEN",
      EG_OPEN: "EG_OPEN",
      OG_CLOSED: "OG_OPEN",
      OG_OPEN: "OG_OPEN",
    },
    CLOSE: {
      EG_CLOSED: "EG_CLOSED",
      EG_OPEN: "EG_CLOSED",
      OG_CLOSED: "OG_CLOSED",
      OG_OPEN: "OG_CLOSED",
    },
    GO_OG: {
      EG_CLOSED: "OG_CLOSED",
      EG_OPEN: "EG_OPEN",
      OG_CLOSED: "OG_CLOSED",
      OG_OPEN: "OG_OPEN",
    },
    GO_EG: {
      EG_CLOSED: "EG_CLOSED",
      EG_OPEN: "EG_OPEN",
      OG_CLOSED: "EG_CLOSED",
      OG_OPEN: "OG_OPEN",
    },
  },
};

function createStarter(
  states: string[],
  inputSymbols: string[],
  outputs: MooreProgram["outputs"],
  initialState: string,
): MooreProgram {
  return {
    states,
    inputSymbols,
    transitions: Object.fromEntries(
      inputSymbols.map((input) => [
        input,
        Object.fromEntries(states.map((state) => [state, state])),
      ]),
    ),
    outputs,
    initialState,
    inputWord: [],
    representation: "binary",
  };
}

const barrierStarter = createStarter(
  ["ALWAYS_OPEN", "CARD_CLOSED", "CARD_OPEN"],
  ["GUEST_MODE", "CARD_MODE", "VALID_CARD", "PASS"],
  {
    ALWAYS_OPEN: { symbol: "OPEN", code: 1 },
    CARD_CLOSED: { symbol: "CLOSED", code: 0 },
    CARD_OPEN: { symbol: "OPEN", code: 1 },
  },
  "CARD_CLOSED",
);
const barrierSolution: MooreProgram = {
  ...barrierStarter,
  transitions: {
    GUEST_MODE: {
      ALWAYS_OPEN: "ALWAYS_OPEN",
      CARD_CLOSED: "ALWAYS_OPEN",
      CARD_OPEN: "ALWAYS_OPEN",
    },
    CARD_MODE: {
      ALWAYS_OPEN: "CARD_CLOSED",
      CARD_CLOSED: "CARD_CLOSED",
      CARD_OPEN: "CARD_OPEN",
    },
    VALID_CARD: {
      ALWAYS_OPEN: "ALWAYS_OPEN",
      CARD_CLOSED: "CARD_OPEN",
      CARD_OPEN: "CARD_OPEN",
    },
    PASS: {
      ALWAYS_OPEN: "ALWAYS_OPEN",
      CARD_CLOSED: "CARD_CLOSED",
      CARD_OPEN: "CARD_CLOSED",
    },
  },
};

const vendingStarter = createStarter(
  ["CREDIT_0", "CREDIT_050", "CREDIT_100", "CREDIT_150"],
  ["COIN_050", "COIN_100", "START", "CANCEL"],
  {
    CREDIT_0: { symbol: "WAIT", code: 0 },
    CREDIT_050: { symbol: "WAIT", code: 0 },
    CREDIT_100: { symbol: "DRINK_100_READY", code: 1 },
    CREDIT_150: { symbol: "DRINK_150_READY", code: 2 },
  },
  "CREDIT_0",
);
const vendingSolution: MooreProgram = {
  ...vendingStarter,
  transitions: {
    COIN_050: {
      CREDIT_0: "CREDIT_050",
      CREDIT_050: "CREDIT_100",
      CREDIT_100: "CREDIT_150",
      CREDIT_150: "CREDIT_150",
    },
    COIN_100: {
      CREDIT_0: "CREDIT_100",
      CREDIT_050: "CREDIT_150",
      CREDIT_100: "CREDIT_150",
      CREDIT_150: "CREDIT_150",
    },
    START: {
      CREDIT_0: "CREDIT_0",
      CREDIT_050: "CREDIT_050",
      CREDIT_100: "CREDIT_0",
      CREDIT_150: "CREDIT_0",
    },
    CANCEL: {
      CREDIT_0: "CREDIT_0",
      CREDIT_050: "CREDIT_0",
      CREDIT_100: "CREDIT_0",
      CREDIT_150: "CREDIT_0",
    },
  },
};

const wiperStarter = createStarter(
  ["OFF", "ONE_SHOT", "CONTINUOUS", "RAIN_SENSOR"],
  ["OFF_SWITCH", "ONE_SHOT", "CONTINUOUS", "SENSOR_MODE", "RAIN"],
  {
    OFF: { symbol: "MOTOR_OFF", code: 0 },
    ONE_SHOT: { symbol: "WIPE_ONCE", code: 1 },
    CONTINUOUS: { symbol: "WIPE_CONTINUOUS", code: 2 },
    RAIN_SENSOR: { symbol: "SENSOR_ACTIVE", code: 3 },
  },
  "OFF",
);
const wiperSolution: MooreProgram = {
  ...wiperStarter,
  transitions: {
    OFF_SWITCH: {
      OFF: "OFF",
      ONE_SHOT: "OFF",
      CONTINUOUS: "OFF",
      RAIN_SENSOR: "OFF",
    },
    ONE_SHOT: {
      OFF: "ONE_SHOT",
      ONE_SHOT: "ONE_SHOT",
      CONTINUOUS: "ONE_SHOT",
      RAIN_SENSOR: "ONE_SHOT",
    },
    CONTINUOUS: {
      OFF: "CONTINUOUS",
      ONE_SHOT: "CONTINUOUS",
      CONTINUOUS: "CONTINUOUS",
      RAIN_SENSOR: "CONTINUOUS",
    },
    SENSOR_MODE: {
      OFF: "RAIN_SENSOR",
      ONE_SHOT: "RAIN_SENSOR",
      CONTINUOUS: "RAIN_SENSOR",
      RAIN_SENSOR: "RAIN_SENSOR",
    },
    RAIN: {
      OFF: "OFF",
      ONE_SHOT: "OFF",
      CONTINUOUS: "CONTINUOUS",
      RAIN_SENSOR: "ONE_SHOT",
    },
  },
};

const alarmStarter = createStarter(
  ["OFF", "ARMED", "ALARM"],
  ["ON", "OFF_BUTTON", "SENSOR"],
  {
    OFF: { symbol: "SILENT", code: 0 },
    ARMED: { symbol: "SILENT", code: 0 },
    ALARM: { symbol: "SIREN", code: 1 },
  },
  "OFF",
);
const alarmSolution: MooreProgram = {
  ...alarmStarter,
  transitions: {
    ON: { OFF: "ARMED", ARMED: "ARMED", ALARM: "ALARM" },
    OFF_BUTTON: { OFF: "OFF", ARMED: "OFF", ALARM: "OFF" },
    SENSOR: { OFF: "OFF", ARMED: "ALARM", ALARM: "ALARM" },
  },
};

const cruiseStarter = createStarter(
  ["OFF", "READY", "ACTIVE"],
  ["ON_OFF", "SET", "BRAKE", "ACCELERATE", "RESET", "CANCEL", "PLUS", "MINUS"],
  {
    OFF: { symbol: "CONTROL_OFF", code: 0 },
    READY: { symbol: "CONTROL_READY", code: 1 },
    ACTIVE: { symbol: "CONTROL_ACTIVE", code: 2 },
  },
  "OFF",
);
const cruiseSolution: MooreProgram = {
  ...cruiseStarter,
  transitions: {
    ON_OFF: { OFF: "READY", READY: "OFF", ACTIVE: "OFF" },
    SET: { OFF: "OFF", READY: "ACTIVE", ACTIVE: "ACTIVE" },
    BRAKE: { OFF: "OFF", READY: "READY", ACTIVE: "READY" },
    ACCELERATE: { OFF: "OFF", READY: "READY", ACTIVE: "READY" },
    RESET: { OFF: "OFF", READY: "ACTIVE", ACTIVE: "ACTIVE" },
    CANCEL: { OFF: "OFF", READY: "READY", ACTIVE: "READY" },
    PLUS: { OFF: "OFF", READY: "READY", ACTIVE: "ACTIVE" },
    MINUS: { OFF: "OFF", READY: "READY", ACTIVE: "ACTIVE" },
  },
};

export const mooreExerciseScenarios: MooreExerciseScenario[] = [
  {
    id: "moore.exercises.turnstile.title",
    storageId: 0x30,
    starterProgram: createEmptyExerciseProgram(),
    solutionProgram: turnstileSolution,
    validationCases: [
      { input: [], expectedOutputCodes: [0] },
      { input: ["COIN"], expectedOutputCodes: [0, 1] },
      { input: ["PASS"], expectedOutputCodes: [0, 0] },
      { input: ["COIN", "PASS"], expectedOutputCodes: [0, 1, 0] },
      { input: ["COIN", "COIN"], expectedOutputCodes: [0, 1, 1] },
      {
        input: ["COIN", "PASS", "PASS"],
        expectedOutputCodes: [0, 1, 0, 0],
      },
    ],
    definition: {
      titleKey: "moore.exercises.turnstile.title",
      descriptionKey: "moore.exercises.turnstile.description",
      difficulty: "easy",
      icon: DoorOpen,
    },
  },
  {
    id: "moore.exercises.elevator.title",
    storageId: 0x31,
    starterProgram: createEmptyExerciseProgram(),
    solutionProgram: elevatorSolution,
    validationCases: createValidationCases(elevatorSolution, [
      [],
      ["OPEN"],
      ["GO_OG"],
      ["OPEN", "GO_OG"],
      ["GO_OG", "OPEN", "CLOSE", "GO_EG"],
      ["GO_OG", "GO_EG"],
    ]),
    definition: {
      titleKey: "moore.exercises.elevator.title",
      descriptionKey: "moore.exercises.elevator.description",
      difficulty: "medium",
      icon: Building2,
    },
  },
  {
    id: "moore.exercises.barrier.title",
    storageId: 0x32,
    starterProgram: createEmptyExerciseProgram(),
    solutionProgram: barrierSolution,
    validationCases: createValidationCases(barrierSolution, [
      [],
      ["VALID_CARD"],
      ["VALID_CARD", "PASS"],
      ["GUEST_MODE", "PASS"],
      ["GUEST_MODE", "CARD_MODE"],
      ["VALID_CARD", "CARD_MODE", "PASS"],
    ]),
    definition: {
      titleKey: "moore.exercises.barrier.title",
      descriptionKey: "moore.exercises.barrier.description",
      difficulty: "easy",
      icon: Car,
    },
  },
  {
    id: "moore.exercises.vending.title",
    storageId: 0x33,
    starterProgram: createEmptyExerciseProgram(),
    solutionProgram: vendingSolution,
    validationCases: createValidationCases(vendingSolution, [
      [],
      ["COIN_050"],
      ["COIN_100"],
      ["COIN_050", "COIN_050", "START"],
      ["COIN_100", "COIN_050", "START"],
      ["COIN_050", "CANCEL"],
      ["COIN_100", "COIN_100"],
    ]),
    definition: {
      titleKey: "moore.exercises.vending.title",
      descriptionKey: "moore.exercises.vending.description",
      difficulty: "hard",
      icon: Coffee,
    },
  },
  {
    id: "moore.exercises.wiper.title",
    storageId: 0x34,
    starterProgram: createEmptyExerciseProgram(),
    solutionProgram: wiperSolution,
    validationCases: createValidationCases(wiperSolution, [
      [],
      ["ONE_SHOT", "OFF_SWITCH"],
      ["CONTINUOUS", "RAIN"],
      ["SENSOR_MODE", "RAIN", "OFF_SWITCH"],
      ["CONTINUOUS", "SENSOR_MODE", "RAIN"],
    ]),
    definition: {
      titleKey: "moore.exercises.wiper.title",
      descriptionKey: "moore.exercises.wiper.description",
      difficulty: "medium",
      icon: Waves,
    },
  },
  {
    id: "moore.exercises.alarm.title",
    storageId: 0x35,
    starterProgram: createEmptyExerciseProgram(),
    solutionProgram: alarmSolution,
    validationCases: createValidationCases(alarmSolution, [
      [],
      ["SENSOR"],
      ["ON", "SENSOR"],
      ["ON", "SENSOR", "OFF_BUTTON"],
      ["ON", "OFF_BUTTON", "SENSOR"],
    ]),
    definition: {
      titleKey: "moore.exercises.alarm.title",
      descriptionKey: "moore.exercises.alarm.description",
      difficulty: "medium",
      icon: BellRing,
    },
  },
  {
    id: "moore.exercises.cruise.title",
    storageId: 0x36,
    starterProgram: createEmptyExerciseProgram(),
    solutionProgram: cruiseSolution,
    validationCases: createValidationCases(cruiseSolution, [
      [],
      ["ON_OFF", "SET"],
      ["ON_OFF", "SET", "BRAKE"],
      ["ON_OFF", "SET", "CANCEL", "RESET"],
      ["ON_OFF", "SET", "PLUS", "MINUS"],
      ["ON_OFF", "SET", "ACCELERATE", "ON_OFF"],
    ]),
    definition: {
      titleKey: "moore.exercises.cruise.title",
      descriptionKey: "moore.exercises.cruise.description",
      difficulty: "hard",
      icon: Gauge,
    },
  },
];

export const mooreMealyExercises = mooreExerciseScenarios.map(
  (scenario) => scenario.definition,
);

export function getMooreExerciseScenario(
  id: TranslationKey,
): MooreExerciseScenario | null {
  return mooreExerciseScenarios.find((scenario) => scenario.id === id) ?? null;
}

function createEmptyExerciseProgram(): MooreProgram {
  return {
    states: ["STATE_0"],
    inputSymbols: [],
    transitions: {},
    outputs: { STATE_0: { symbol: "OUT_0", code: 0 } },
    initialState: "STATE_0",
    inputWord: [],
    representation: "binary",
  };
}

function createValidationCases(
  solution: MooreProgram,
  inputs: string[][],
): MooreValidationCase[] {
  return inputs.map((input) => ({
    input,
    expectedOutputCodes: runProgramForOutputCodes(solution, input),
  }));
}

function runProgramForOutputCodes(
  program: MooreProgram,
  input: string[],
): number[] {
  let state = program.initialState;
  const outputCodes = [program.outputs[state].code];
  for (const symbol of input) {
    state = program.transitions[symbol][state];
    outputCodes.push(program.outputs[state].code);
  }
  return outputCodes;
}

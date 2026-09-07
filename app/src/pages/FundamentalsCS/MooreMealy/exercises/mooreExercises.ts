import {
  BellRing,
  Building2,
  TrafficCone,
  Coffee,
  DoorOpen,
  Gauge,
  Waves,
} from "lucide-react";
import type { MooreProgram } from "../components/Simulator/domain/mooreTypes";
import type { MooreExerciseScenario } from "./exerciseTypes";

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

const trafficLightStarter = createStarter(
  ["RED", "RED_YELLOW", "GREEN", "YELLOW"],
  ["TICK", "HOLD", "RESET"],
  {
    RED: { symbol: "RED", code: 0 },
    RED_YELLOW: { symbol: "RED_YELLOW", code: 1 },
    GREEN: { symbol: "GREEN", code: 2 },
    YELLOW: { symbol: "YELLOW", code: 3 },
  },
  "RED",
);
const trafficLightSolution: MooreProgram = {
  ...trafficLightStarter,
  transitions: {
    TICK: {
      RED: "RED_YELLOW",
      RED_YELLOW: "GREEN",
      GREEN: "YELLOW",
      YELLOW: "RED",
    },
    HOLD: {
      RED: "RED",
      RED_YELLOW: "RED_YELLOW",
      GREEN: "GREEN",
      YELLOW: "YELLOW",
    },
    RESET: {
      RED: "RED",
      RED_YELLOW: "RED",
      GREEN: "RED",
      YELLOW: "RED",
    },
  },
};

const vendingStarter = createStarter(
  ["CREDIT_0", "CREDIT_050", "CREDIT_100", "CREDIT_150", "REFUND"],
  ["COIN_050", "COIN_100", "START", "CANCEL"],
  {
    CREDIT_0: { symbol: "WAIT", code: 0 },
    CREDIT_050: { symbol: "WAIT", code: 0 },
    CREDIT_100: { symbol: "DRINK_100_READY", code: 1 },
    CREDIT_150: { symbol: "DRINK_150_READY", code: 2 },
    REFUND: { symbol: "RETURN_COINS", code: 3 },
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
      CREDIT_150: "REFUND",
      REFUND: "REFUND",
    },
    COIN_100: {
      CREDIT_0: "CREDIT_100",
      CREDIT_050: "CREDIT_150",
      CREDIT_100: "REFUND",
      CREDIT_150: "REFUND",
      REFUND: "REFUND",
    },
    START: {
      CREDIT_0: "CREDIT_0",
      CREDIT_050: "CREDIT_050",
      CREDIT_100: "CREDIT_0",
      CREDIT_150: "CREDIT_0",
      REFUND: "CREDIT_0",
    },
    CANCEL: {
      CREDIT_0: "CREDIT_0",
      CREDIT_050: "REFUND",
      CREDIT_100: "REFUND",
      CREDIT_150: "REFUND",
      REFUND: "CREDIT_0",
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
    machineType: "moore",
    id: "moore-mealy.exercises.turnstile.title",
    storageId: 0x30,
    starterProgram: turnstileStarter,
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
      titleKey: "moore-mealy.exercises.turnstile.title",
      descriptionKey: "moore-mealy.exercises.turnstile.description",
      difficulty: "easy",
      icon: DoorOpen,
    },
  },
  {
    machineType: "moore",
    id: "moore-mealy.exercises.elevator.title",
    storageId: 0x31,
    starterProgram: elevatorStarter,
    solutionProgram: elevatorSolution,
    validationCases: [
      { input: [], expectedOutputCodes: [0] },
      { input: ["OPEN"], expectedOutputCodes: [0, 0] },
      { input: ["GO_OG"], expectedOutputCodes: [0, 1] },
      { input: ["OPEN", "GO_OG"], expectedOutputCodes: [0, 0, 0] },
      {
        input: ["GO_OG", "OPEN", "CLOSE", "GO_EG"],
        expectedOutputCodes: [0, 1, 1, 1, 0],
      },
      { input: ["GO_OG", "GO_EG"], expectedOutputCodes: [0, 1, 0] },
    ],
    definition: {
      titleKey: "moore-mealy.exercises.elevator.title",
      descriptionKey: "moore-mealy.exercises.elevator.description",
      difficulty: "medium",
      icon: Building2,
    },
  },
  {
    machineType: "moore",
    id: "moore-mealy.exercises.trafficLight.title",
    storageId: 0x32,
    starterProgram: trafficLightStarter,
    solutionProgram: trafficLightSolution,
    validationCases: [
      { input: [], expectedOutputCodes: [0] },
      { input: ["TICK"], expectedOutputCodes: [0, 1] },
      { input: ["TICK", "TICK"], expectedOutputCodes: [0, 1, 2] },
      { input: ["TICK", "TICK", "TICK"], expectedOutputCodes: [0, 1, 2, 3] },
      {
        input: ["TICK", "TICK", "TICK", "TICK"],
        expectedOutputCodes: [0, 1, 2, 3, 0],
      },
      { input: ["HOLD"], expectedOutputCodes: [0, 0] },
      {
        input: ["TICK", "HOLD", "TICK"],
        expectedOutputCodes: [0, 1, 1, 2],
      },
      {
        input: ["TICK", "TICK", "RESET"],
        expectedOutputCodes: [0, 1, 2, 0],
      },
    ],
    definition: {
      titleKey: "moore-mealy.exercises.trafficLight.title",
      descriptionKey: "moore-mealy.exercises.trafficLight.description",
      difficulty: "easy",
      icon: TrafficCone,
    },
  },
  {
    machineType: "moore",
    id: "moore-mealy.exercises.vending.title",
    storageId: 0x33,
    starterProgram: vendingStarter,
    solutionProgram: vendingSolution,
    validationCases: [
      { input: [], expectedOutputCodes: [0] },
      { input: ["COIN_050"], expectedOutputCodes: [0, 0] },
      { input: ["COIN_100"], expectedOutputCodes: [0, 1] },
      {
        input: ["COIN_050", "COIN_050", "START"],
        expectedOutputCodes: [0, 0, 1, 0],
      },
      {
        input: ["COIN_100", "COIN_050", "START"],
        expectedOutputCodes: [0, 1, 2, 0],
      },
      { input: ["COIN_050", "CANCEL"], expectedOutputCodes: [0, 0, 3] },
      {
        input: ["COIN_050", "CANCEL", "START"],
        expectedOutputCodes: [0, 0, 3, 0],
      },
      {
        input: ["COIN_100", "COIN_050", "COIN_050"],
        expectedOutputCodes: [0, 1, 2, 3],
      },
      { input: ["COIN_100", "COIN_100"], expectedOutputCodes: [0, 1, 3] },
      {
        input: ["COIN_100", "COIN_100", "START"],
        expectedOutputCodes: [0, 1, 3, 0],
      },
    ],
    definition: {
      titleKey: "moore-mealy.exercises.vending.title",
      descriptionKey: "moore-mealy.exercises.vending.description",
      difficulty: "hard",
      icon: Coffee,
    },
  },
  {
    machineType: "moore",
    id: "moore-mealy.exercises.wiper.title",
    storageId: 0x34,
    starterProgram: wiperStarter,
    solutionProgram: wiperSolution,
    validationCases: [
      { input: [], expectedOutputCodes: [0] },
      {
        input: ["ONE_SHOT", "OFF_SWITCH"],
        expectedOutputCodes: [0, 1, 0],
      },
      { input: ["CONTINUOUS", "RAIN"], expectedOutputCodes: [0, 2, 2] },
      {
        input: ["SENSOR_MODE", "RAIN", "OFF_SWITCH"],
        expectedOutputCodes: [0, 3, 1, 0],
      },
      {
        input: ["CONTINUOUS", "SENSOR_MODE", "RAIN"],
        expectedOutputCodes: [0, 2, 3, 1],
      },
    ],
    definition: {
      titleKey: "moore-mealy.exercises.wiper.title",
      descriptionKey: "moore-mealy.exercises.wiper.description",
      difficulty: "medium",
      icon: Waves,
    },
  },
  {
    machineType: "moore",
    id: "moore-mealy.exercises.alarm.title",
    storageId: 0x35,
    starterProgram: alarmStarter,
    solutionProgram: alarmSolution,
    validationCases: [
      { input: [], expectedOutputCodes: [0] },
      { input: ["SENSOR"], expectedOutputCodes: [0, 0] },
      { input: ["ON", "SENSOR"], expectedOutputCodes: [0, 0, 1] },
      {
        input: ["ON", "SENSOR", "OFF_BUTTON"],
        expectedOutputCodes: [0, 0, 1, 0],
      },
      {
        input: ["ON", "OFF_BUTTON", "SENSOR"],
        expectedOutputCodes: [0, 0, 0, 0],
      },
    ],
    definition: {
      titleKey: "moore-mealy.exercises.alarm.title",
      descriptionKey: "moore-mealy.exercises.alarm.description",
      difficulty: "medium",
      icon: BellRing,
    },
  },
  {
    machineType: "moore",
    id: "moore-mealy.exercises.cruise.title",
    storageId: 0x36,
    starterProgram: cruiseStarter,
    solutionProgram: cruiseSolution,
    validationCases: [
      { input: [], expectedOutputCodes: [0] },
      { input: ["ON_OFF", "SET"], expectedOutputCodes: [0, 1, 2] },
      {
        input: ["ON_OFF", "SET", "BRAKE"],
        expectedOutputCodes: [0, 1, 2, 1],
      },
      {
        input: ["ON_OFF", "SET", "CANCEL", "RESET"],
        expectedOutputCodes: [0, 1, 2, 1, 2],
      },
      {
        input: ["ON_OFF", "SET", "PLUS", "MINUS"],
        expectedOutputCodes: [0, 1, 2, 2, 2],
      },
      {
        input: ["ON_OFF", "SET", "ACCELERATE", "ON_OFF"],
        expectedOutputCodes: [0, 1, 2, 1, 0],
      },
    ],
    definition: {
      titleKey: "moore-mealy.exercises.cruise.title",
      descriptionKey: "moore-mealy.exercises.cruise.description",
      difficulty: "hard",
      icon: Gauge,
    },
  },
];

export const mooreExercises = mooreExerciseScenarios.map(
  (scenario) => scenario.definition,
);

import type {
  BaseType,
  ArithmeticModeType,
  SimulatorMode,
} from "./nsTransferCodec";
import type { ExerciseStateInit } from "./exerciseStateConfig";
import { exerciseStateConfig } from "./exerciseStateConfig";
import type { TopicItem } from "@/types/exercise";

/** Returns a random integer between min and max (inclusive). */
const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/** Converts a decimal number to a binary string. */
const decToBin = (n: number): string => n.toString(2);

/**
 * Resolves randomized initial values based on the exercise type.
 * Flags are read from `exerciseStateConfig`.
 */
export function resolveRandomInit(
  config: ExerciseStateInit,
): ExerciseStateInit {
  const base: ExerciseStateInit = {
    mode: config.mode,
    initialBase: config.initialBase,
    initialTargetBase: config.initialTargetBase,
    initialSubMode: config.initialSubMode,
    initialConverterMode: config.initialConverterMode,
  };

  // --- Integers mode: random values for different bases ---
  if (config.randomDecToBin) {
    return {
      ...base,
      initialValue: randInt(1, 63).toString(),
    };
  }

  if (config.randomBinToHexOct) {
    return {
      ...base,
      initialTargetBase: Math.random() > 0.5 ? "hex" : "oct",
      initialValue: Array.from({ length: 8 }, () =>
        Math.random() < 0.5 ? "1" : "0",
      ).join(""),
    };
  }

  if (config.randomOctToHex) {
    return {
      ...base,
      initialValue: randInt(64, 511).toString(8).padStart(3, "0"),
    };
  }

  if (config.randomHexToBin) {
    return {
      ...base,
      initialValue: randInt(16, 255)
        .toString(16)
        .toUpperCase()
        .padStart(2, "0"),
    };
  }

  // --- Arithmetic mode: random operands ---
  if (config.randomBinAdd) {
    return {
      ...base,
      initialSubMode: "addition" as ArithmeticModeType,
      initialValueA: decToBin(randInt(10, 100)),
      initialValueB: decToBin(randInt(10, 100)),
    };
  }

  if (config.randomAddSub) {
    const subMode: ArithmeticModeType =
      Math.random() > 0.5 ? "addition" : "subtraction";
    return {
      ...base,
      initialSubMode: subMode,
      initialValueA: decToBin(randInt(10, 100)).padStart(8, "0"),
      initialValueB: decToBin(randInt(10, 100)).padStart(8, "0"),
    };
  }

  if (config.randomMult) {
    return {
      ...base,
      initialSubMode: "multiplication" as ArithmeticModeType,
      initialValueA: decToBin(randInt(8, 15)),
      initialValueB: decToBin(randInt(16, 31)),
    };
  }

  // --- Fractional / IEEE mode: random floating-point values ---
  if (config.randomFloatToBin) {
    const wholes = randInt(-20, 20);
    const fracs = [0.5, 0.25, 0.75, 0.125, 0.375, 0.625, 0.875];
    return {
      ...base,
      initialValue: (wholes + fracs[randInt(0, fracs.length - 1)]).toString(),
    };
  }

  if (config.randomIeeeEncode) {
    return {
      ...base,
      initialConverterMode: "decToIeee",
      initialValue: (Math.random() * 200 - 100).toFixed(4),
    };
  }

  if (config.randomIeeeDecode) {
    const sign = Math.random() < 0.5 ? "1" : "0";
    const exp = randInt(1, 254).toString(2).padStart(8, "0");
    const mant = Array.from({ length: 23 }, () =>
      Math.random() < 0.5 ? "1" : "0",
    ).join("");
    return {
      ...base,
      initialConverterMode: "ieeeToDec",
      initialValue: sign + exp + mant,
    };
  }

  // No random flags: return base configuration as-is
  return config;
}

/**
 * Default initial state when no exercise is active (free mode).
 */
export const defaultExerciseState: ExerciseStateInit = {
  mode: "integers",
  initialValue: "",
  initialBase: "dec" as BaseType,
  initialTargetBase: "bin" as BaseType,
  initialValueA: "",
  initialValueB: "",
  initialSubMode: "addition" as ArithmeticModeType,
  initialConverterMode: "decToIeee",
};

/**
 * Resolves the initial simulator mode for an exercise/example ID.
 * Falls back to prefix heuristics when no explicit config exists.
 */
export function getInitialActiveMode(id: string): SimulatorMode {
  const config = exerciseStateConfig[id];
  if (config) return config.mode;

  if (
    id.includes("floatToBin") ||
    id.includes("example_u05_1") ||
    id.includes("example_u05_2")
  )
    return "fractional";
  if (
    id.includes("ieee") ||
    id.includes("example_u05_3") ||
    id.includes("example_u05_4") ||
    id.includes("example_u07_5")
  )
    return "ieee754";
  if (
    id.includes("Add") ||
    id.includes("Sub") ||
    id.includes("mult") ||
    id.includes("example_u06") ||
    id.includes("example_u03_2") ||
    id.includes("example_u07_2") ||
    id.includes("example_u07_4")
  )
    return "arithmetic";
  if (id.includes("example_u07_3")) return "negative";
  return "integers";
}

export interface ResolvedExerciseInitialState {
  isExerciseMode: boolean;
  showSolution: boolean;
  activeMode: SimulatorMode;
  initialValue: string;
  initialBase: BaseType;
  initialTargetBase: BaseType;
  initialValueA: string;
  initialValueB: string;
  initialSubMode: ArithmeticModeType;
  initialConverterMode: "decToIeee" | "ieeeToDec";
}

/**
 * Resolves the complete initial state for the simulator when a
 * selected exercise changes. Exported so it can be unit-tested.
 */
export function resolveExerciseInitialState(
  selectedExercise: TopicItem | null | undefined,
): ResolvedExerciseInitialState {
  if (!selectedExercise) {
    return {
      isExerciseMode: false,
      showSolution: true,
      activeMode: defaultExerciseState.mode,
      initialValue: defaultExerciseState.initialValue ?? "",
      initialBase: defaultExerciseState.initialBase ?? "dec",
      initialTargetBase: defaultExerciseState.initialTargetBase ?? "bin",
      initialValueA: defaultExerciseState.initialValueA ?? "",
      initialValueB: defaultExerciseState.initialValueB ?? "",
      initialSubMode: defaultExerciseState.initialSubMode ?? "addition",
      initialConverterMode:
        defaultExerciseState.initialConverterMode ?? "decToIeee",
    };
  }

  const isExample = selectedExercise.id.includes(".example");
  const config = exerciseStateConfig[selectedExercise.id];
  const init = config
    ? resolveRandomInit(config)
    : { mode: getInitialActiveMode(selectedExercise.id) };

  return {
    isExerciseMode: !isExample,
    showSolution: isExample,
    activeMode: init.mode,
    initialValue: init.initialValue ?? "",
    initialBase: init.initialBase ?? "dec",
    initialTargetBase: init.initialTargetBase ?? "bin",
    initialValueA: init.initialValueA ?? "",
    initialValueB: init.initialValueB ?? "",
    initialSubMode: init.initialSubMode ?? "addition",
    initialConverterMode: init.initialConverterMode ?? "decToIeee",
  };
}

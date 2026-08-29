import type {
  BaseType,
  SimulatorMode,
  ArithmeticModeType,
} from "./nsTransferCodec";

/**
 * Defines the initial state used when an exercise or example ID is started.
 * Random values are flagged here and resolved at runtime.
 */
export interface ExerciseStateInit {
  mode: SimulatorMode;
  initialValue?: string;
  initialBase?: BaseType;
  initialTargetBase?: BaseType;
  initialSubMode?: ArithmeticModeType;
  initialValueA?: string;
  initialValueB?: string;
  initialConverterMode?: "decToIeee" | "ieeeToDec";
  /** Flags that trigger random initial value generation at runtime. */
  randomDecToBin?: true;
  randomBinAdd?: true;
  randomBinToHexOct?: true;
  randomOctToHex?: true;
  randomHexToBin?: true;
  randomFloatToBin?: true;
  randomIeeeEncode?: true;
  randomIeeeDecode?: true;
  randomAddSub?: true;
  randomMult?: true;
}

/**
 * Maps exercise/example IDs to their initial simulator state.
 * Use the flags below for randomized values.
 */
export const exerciseStateConfig: Record<string, ExerciseStateInit> = {
  // --- Exercises (randomized values, exercise mode) ---
  "number.ex_u03_decToBin": {
    mode: "integers",
    initialBase: "dec",
    initialTargetBase: "bin",
    randomDecToBin: true,
  },
  "number.ex_u03_binAdd": {
    mode: "arithmetic",
    initialSubMode: "addition",
    randomBinAdd: true,
  },
  "number.ex_u04_binToHexOct": {
    mode: "integers",
    initialBase: "bin",
    initialTargetBase: "hex",
    randomBinToHexOct: true,
  },
  "number.ex_u04_octToHex": {
    mode: "integers",
    initialBase: "oct",
    initialTargetBase: "hex",
    randomOctToHex: true,
  },
  "number.ex_u04_hexToBin": {
    mode: "integers",
    initialBase: "hex",
    initialTargetBase: "bin",
    randomHexToBin: true,
  },
  "number.ex_u05_floatToBin": {
    mode: "fractional",
    randomFloatToBin: true,
  },
  "number.ex_u05_ieeeEncode": {
    mode: "ieee754",
    initialConverterMode: "decToIeee",
    randomIeeeEncode: true,
  },
  "number.ex_u05_ieeeDecode": {
    mode: "ieee754",
    initialConverterMode: "ieeeToDec",
    randomIeeeDecode: true,
  },
  "number.ex_u06_addSub": {
    mode: "arithmetic",
    initialSubMode: "addition",
    randomAddSub: true,
  },
  "number.ex_u06_mult": {
    mode: "arithmetic",
    initialSubMode: "multiplication",
    randomMult: true,
  },

  // --- Examples (fixed values) ---
  "number.example_u03_1": {
    mode: "integers",
    initialBase: "dec",
    initialTargetBase: "bin",
    initialValue: "26",
  },
  "number.example_u03_2": {
    mode: "arithmetic",
    initialSubMode: "addition",
    initialValueA: "110010",
    initialValueB: "1101",
  },
  "number.example_u04_1": {
    mode: "integers",
    initialBase: "bin",
    initialTargetBase: "hex",
    initialValue: "01111010",
  },
  "number.example_u04_2": {
    mode: "integers",
    initialBase: "bin",
    initialTargetBase: "oct",
    initialValue: "00111100",
  },
  "number.example_u04_3": {
    mode: "integers",
    initialBase: "oct",
    initialTargetBase: "hex",
    initialValue: "760",
  },
  "number.example_u04_4": {
    mode: "integers",
    initialBase: "hex",
    initialTargetBase: "bin",
    initialValue: "7F",
  },
  "number.example_u05_1": {
    mode: "fractional",
    initialValue: "10.5",
  },
  "number.example_u05_2": {
    mode: "fractional",
    initialValue: "3.375",
  },
  "number.example_u05_3": {
    mode: "ieee754",
    initialConverterMode: "decToIeee",
    initialValue: "-4.4375",
  },
  "number.example_u05_4": {
    mode: "ieee754",
    initialConverterMode: "ieeeToDec",
    initialValue: "01000001010101000000000000000000",
  },
  "number.example_u06_1_add": {
    mode: "arithmetic",
    initialSubMode: "addition",
    initialValueA: "01101101",
    initialValueB: "00100111",
  },
  "number.example_u06_1_sub": {
    mode: "arithmetic",
    initialSubMode: "subtraction",
    initialValueA: "01101101",
    initialValueB: "00100111",
  },
  "number.example_u06_2": {
    mode: "arithmetic",
    initialSubMode: "multiplication",
    initialValueA: "1011",
    initialValueB: "11001",
  },
  "number.example_u07_1_1": {
    mode: "integers",
    initialBase: "dec",
    initialTargetBase: "bin",
    initialValue: "127",
  },
  "number.example_u07_1_2": {
    mode: "integers",
    initialBase: "dec",
    initialTargetBase: "bin",
    initialValue: "45",
  },
  "number.example_u07_1_3": {
    mode: "integers",
    initialBase: "dec",
    initialTargetBase: "bin",
    initialValue: "456",
  },
  "number.example_u07_1_4": {
    mode: "integers",
    initialBase: "dec",
    initialTargetBase: "bin",
    initialValue: "255",
  },
  "number.example_u07_1_5": {
    mode: "integers",
    initialBase: "dec",
    initialTargetBase: "bin",
    initialValue: "110",
  },
  "number.example_u07_2_1": {
    mode: "arithmetic",
    initialSubMode: "addition",
    initialValueA: "110101",
    initialValueB: "100110",
  },
  "number.example_u07_2_2": {
    mode: "arithmetic",
    initialSubMode: "addition",
    initialValueA: "10000000",
    initialValueB: "111111",
  },
  "number.example_u07_2_3": {
    mode: "arithmetic",
    initialSubMode: "addition",
    initialValueA: "11111111",
    initialValueB: "11001000",
  },
  "number.example_u07_3_1": {
    mode: "negative",
    initialValue: "-5",
  },
  "number.example_u07_3_2": {
    mode: "negative",
    initialValue: "-125",
  },
  "number.example_u07_3_3": {
    mode: "negative",
    initialValue: "0",
  },
  "number.example_u07_3_4": {
    mode: "negative",
    initialValue: "-63",
  },
  "number.example_u07_3_5": {
    mode: "negative",
    initialValue: "-128",
  },
  "number.example_u07_4_1": {
    mode: "arithmetic",
    initialSubMode: "subtraction",
    initialValueA: "110010",
    initialValueB: "100110",
  },
  "number.example_u07_4_2": {
    mode: "arithmetic",
    initialSubMode: "subtraction",
    initialValueA: "1000011",
    initialValueB: "1000100",
  },
  "number.example_u07_4_3": {
    mode: "arithmetic",
    initialSubMode: "subtraction",
    initialValueA: "101",
    initialValueB: "1000",
  },
  "number.example_u07_4_4": {
    mode: "arithmetic",
    initialSubMode: "subtraction",
    initialValueA: "1111",
    initialValueB: "1111",
  },
  "number.example_u07_5_1": {
    mode: "ieee754",
    initialConverterMode: "decToIeee",
    initialValue: "5.75",
  },
  "number.example_u07_5_2": {
    mode: "ieee754",
    initialConverterMode: "decToIeee",
    initialValue: "24.25",
  },
  "number.example_u07_5_3": {
    mode: "ieee754",
    initialConverterMode: "decToIeee",
    initialValue: "18.375",
  },
  "number.example_u07_5_4": {
    mode: "ieee754",
    initialConverterMode: "decToIeee",
    initialValue: "-2.8125",
  },
  "number.example_u07_5_5": {
    mode: "ieee754",
    initialConverterMode: "decToIeee",
    initialValue: "-10.9375",
  },
};

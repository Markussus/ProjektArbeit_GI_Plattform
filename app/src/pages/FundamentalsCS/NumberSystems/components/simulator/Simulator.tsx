import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IntegerConverter } from "./IntegerConverter";
import { NegativeNumbers } from "./NegativeNumbers";
import { IEEE754Converter } from "./IEEE754Converter";
import { ArithmeticMode } from "./arithmetic";
import type { Exercise } from "@/types/exercise";
import { cn } from "@/lib/utils";
type SimulatorMode = "integers" | "negative" | "ieee754" | "arithmetic";

interface SimulatorProps {
  selectedExercise?: Exercise | null;
}

export function Simulator({ selectedExercise }: SimulatorProps) {
  const { t } = useTranslation("translation");
  const [activeMode, setActiveMode] = useState<SimulatorMode>("integers");

  // Exercise mode states
  const [isExerciseMode, setIsExerciseMode] = useState(false);
  const [showSolution, setShowSolution] = useState(true);

  // Initial values for converters when launched via exercise
  const [initialValue, setInitialValue] = useState<string>("");
  const [initialBase, setInitialBase] = useState<"dec" | "bin" | "oct" | "hex">(
    "dec",
  );
  const [initialTargetBase, setInitialTargetBase] = useState<
    "dec" | "bin" | "oct" | "hex"
  >("bin");
  const [initialValueA, setInitialValueA] = useState<string>("");
  const [initialValueB, setInitialValueB] = useState<string>("");
  const [initialSubMode, setInitialSubMode] = useState<
    | "addition"
    | "subtraction"
    | "multiplication"
    | "division"
    | "shifting"
    | "ieee754"
    | "compare"
  >("addition");
  const [initialConverterMode, setInitialConverterMode] = useState<
    "decToIeee" | "ieeeToDec"
  >("decToIeee");

  useEffect(() => {
    if (selectedExercise) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsExerciseMode(true);
      setShowSolution(false);

      const randInt = (min: number, max: number) =>
        Math.floor(Math.random() * (max - min + 1)) + min;
      const decToBin = (n: number) => n.toString(2);

      // Match exercise id using prefix/contains or exact matching logic based on data.
      if (selectedExercise.id === "number.ex_u03_decToBin") {
        setActiveMode("integers");
        setInitialBase("dec");
        setInitialTargetBase("bin");
        setInitialValue(randInt(1, 63).toString());
      } else if (selectedExercise.id === "number.ex_u03_binAdd") {
        setActiveMode("arithmetic");
        setInitialSubMode("addition");
        setInitialValueA(decToBin(randInt(10, 100)));
        setInitialValueB(decToBin(randInt(10, 100)));
      } else if (selectedExercise.id === "number.ex_u04_binToHexOct") {
        setActiveMode("integers");
        setInitialBase("bin");
        setInitialTargetBase(Math.random() > 0.5 ? "hex" : "oct");
        setInitialValue(
          Array.from({ length: 8 }, () =>
            Math.random() < 0.5 ? "1" : "0",
          ).join(""),
        );
      } else if (selectedExercise.id === "number.ex_u04_octToHex") {
        setActiveMode("integers");
        setInitialBase("oct");
        setInitialTargetBase("hex");
        setInitialValue(randInt(64, 511).toString(8).padStart(3, "0"));
      } else if (selectedExercise.id === "number.ex_u04_hexToBin") {
        setActiveMode("integers");
        setInitialBase("hex");
        setInitialTargetBase("bin");
        setInitialValue(
          randInt(16, 255).toString(16).toUpperCase().padStart(2, "0"),
        );
      } else if (selectedExercise.id === "number.ex_u05_floatToBin") {
        setActiveMode("ieee754");
        setInitialConverterMode("decToIeee");
        const wholes = randInt(-20, 20);
        const fracs = [0.5, 0.25, 0.75, 0.125, 0.375, 0.625, 0.875];
        setInitialValue(
          (wholes + fracs[randInt(0, fracs.length - 1)]).toString(),
        );
      } else if (selectedExercise.id === "number.ex_u05_ieeeEncode") {
        setActiveMode("ieee754");
        setInitialConverterMode("decToIeee");
        setInitialValue((Math.random() * 200 - 100).toFixed(4));
      } else if (selectedExercise.id === "number.ex_u05_ieeeDecode") {
        setActiveMode("ieee754");
        setInitialConverterMode("ieeeToDec");
        const sign = Math.random() < 0.5 ? "1" : "0";
        const exp = randInt(1, 254).toString(2).padStart(8, "0");
        const mant = Array.from({ length: 23 }, () =>
          Math.random() < 0.5 ? "1" : "0",
        ).join("");
        setInitialValue(sign + exp + mant);
      } else if (selectedExercise.id === "number.ex_u06_addSub") {
        setActiveMode("arithmetic");
        setInitialSubMode(Math.random() > 0.5 ? "addition" : "subtraction");
        setInitialValueA(decToBin(randInt(10, 100)).padStart(8, "0"));
        setInitialValueB(decToBin(randInt(10, 100)).padStart(8, "0"));
      } else if (selectedExercise.id === "number.ex_u06_mult") {
        setActiveMode("arithmetic");
        setInitialSubMode("multiplication");
        setInitialValueA(decToBin(randInt(8, 15)));
        setInitialValueB(decToBin(randInt(16, 31)));
      }
    } else {
      setIsExerciseMode(false);
      setShowSolution(true); // Free simulator mode
    }
  }, [selectedExercise]);

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Dashboard Navigation */}
      <div className="border-border flex gap-1 border-b">
        {(
          ["integers", "negative", "ieee754", "arithmetic"] as SimulatorMode[]
        ).map((mode) => (
          <button
            key={mode}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium",
              activeMode === mode
                ? "text-tab-active"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setActiveMode(mode)}
          >
            {t(`simulator.tabs.${mode}`)}
            {activeMode === mode && (
              <span className="bg-tab-indicator absolute inset-x-0 -bottom-px h-0.5" />
            )}
          </button>
        ))}
      </div>

      {/* Simulator Content */}
      <div className="flex-1 overflow-auto">
        {activeMode === "integers" && (
          <IntegerConverter
            key={
              selectedExercise?.id
                ? `${selectedExercise.id}-${initialValue}`
                : "free-int"
            }
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={() => setShowSolution(true)}
            initialValue={initialValue}
            initialBase={initialBase}
            initialTargetBase={initialTargetBase}
          />
        )}
        {activeMode === "negative" && (
          <NegativeNumbers
            key={
              selectedExercise?.id
                ? `${selectedExercise.id}-${initialValue}`
                : "free-neg"
            }
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={() => setShowSolution(true)}
            initialValue={initialValue}
          />
        )}
        {activeMode === "ieee754" && (
          <IEEE754Converter
            key={
              selectedExercise?.id
                ? `${selectedExercise.id}-${initialValue}`
                : "free-ieee"
            }
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={() => setShowSolution(true)}
            initialValue={initialValue}
            initialConverterMode={initialConverterMode}
          />
        )}
        {activeMode === "arithmetic" && (
          <ArithmeticMode
            key={
              selectedExercise?.id
                ? `${selectedExercise.id}-${initialValueA}-${initialValueB}`
                : "free-arith"
            }
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={() => setShowSolution(true)}
            initialMode={
              initialSubMode as
                | "addition"
                | "subtraction"
                | "multiplication"
                | "division"
                | "shifting"
                | "ieee754"
                | "compare"
            }
            initialValueA={initialValueA}
            initialValueB={initialValueB}
          />
        )}
      </div>
    </div>
  );
}

import type { TMProgram } from "./tmProgram";
import type { TMRuntime } from "./tmRuntime";
import type { HeadMovement, TapeSymbol } from "./tmTypes";

export function createInitialRuntime(program: TMProgram): TMRuntime {
  const tape: Record<number, TapeSymbol> = {};

  program.initialTape.forEach((symbol, index) => {
    tape[index] = symbol;
  });

  const runtime: TMRuntime = {
    currentState: program.initialState,
    headPosition: 0,
    tape,
    stepCount: 0,
    halted: false,
    haltReason: null,
  };

  return applyHaltingState(program, runtime);
}

export function readCurrentSymbol(
  program: Pick<TMProgram, "blankSymbol">,
  runtime: Pick<TMRuntime, "tape" | "headPosition">,
): TapeSymbol {
  return runtime.tape[runtime.headPosition] ?? program.blankSymbol;
}

export function canStep(program: TMProgram, runtime: TMRuntime): boolean {
  void program;
  return !runtime.halted;
}

export function stepRuntime(program: TMProgram, runtime: TMRuntime): TMRuntime {
  if (!canStep(program, runtime)) {
    return runtime;
  }

  const currentSymbol = readCurrentSymbol(program, runtime);
  const transition =
    program.transitions[currentSymbol]?.[runtime.currentState] ?? null;

  if (!transition) {
    return {
      ...runtime,
      halted: true,
      haltReason: {
        type: "missing_transition",
        state: runtime.currentState,
        symbol: currentSymbol,
      },
    };
  }

  const nextRuntime: TMRuntime = {
    currentState: transition.nextState,
    headPosition: getNextHeadPosition(
      runtime.headPosition,
      transition.movement,
    ),
    tape: {
      ...runtime.tape,
      [runtime.headPosition]: transition.writeSymbol,
    },
    stepCount: runtime.stepCount + 1,
    halted: false,
    haltReason: null,
  };

  return applyHaltingState(program, nextRuntime);
}

function applyHaltingState(program: TMProgram, runtime: TMRuntime): TMRuntime {
  if (!program.haltStates.includes(runtime.currentState)) {
    return runtime;
  }

  return {
    ...runtime,
    halted: true,
    haltReason: {
      type: "halt_state",
      state: runtime.currentState,
    },
  };
}

function getNextHeadPosition(
  headPosition: number,
  movement: HeadMovement,
): number {
  if (movement === "R") {
    return headPosition + 1;
  }

  if (movement === "L") {
    return headPosition - 1;
  }

  return headPosition;
}

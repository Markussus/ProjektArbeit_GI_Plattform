**Target Architecture**

For this folder, I would split the architecture into four clear layers:

1. `domain`: the Turing machine's domain model, completely UI-independent  
2. `application`: editor and simulator orchestration for React  
3. `presentation`: React views and pure display/input components  
4. `adapters`: mapping from domain data to generic UI components such as `TableView`

The central domain decisions would be:

- Incomplete transition tables are `valid`.
- A missing transition is `not an exception case`, but a `normal halting condition with a reason`.
- Validation checks only structural consistency, not completeness of the transition function.

**Proposed Folder Structure**

```text
Simulator/
  index.ts
  TMSimulatorPage.tsx

  domain/
    tmTypes.ts
    tmProgram.ts
    tmRuntime.ts
    tmMachine.ts
    tmProgramValidation.ts
    tmHalting.ts

  application/
    useTMSimulator.ts
    useTMConfigEditor.ts
    tmEditorReducer.ts
    tmEditorCommands.ts

  adapters/
    tmTableAdapter.ts
    tmTapeAdapter.ts

  presentation/
    TMSimulatorLayout.tsx
    TMConfigScreen.tsx
    TMSimulationScreen.tsx
    TMGeneralSettings.tsx
    TMHaltStatesPanel.tsx
    TMTransitionTableEditor.tsx
    TMSimulationStatusCard.tsx
    TMTapeView.tsx

  config/
    defaultTMProgram.ts
```

**Responsibilities**

`domain/tmProgram.ts`
- Defines the static machine program.
- In other words: states, alphabets, blank symbol, start state, halting states, transitions.
- Contains only domain data and, if needed, small invariant helpers.

`domain/tmRuntime.ts`
- Defines only the runtime state.
- In other words: current state, head position, tape, step counter, halting status, halting reason.

Example:

```ts
type TMHaltReason =
  | { type: "halt_state"; state: string }
  | { type: "missing_transition"; state: string; symbol: string };

interface TMRuntime {
  currentState: string;
  headPosition: number;
  tape: Record<number, string>;
  stepCount: number;
  halted: boolean;
  haltReason: TMHaltReason | null;
}
```

This is architecturally important: a missing transition is modeled explicitly instead of being mixed into an `errorMessage`.

`domain/tmMachine.ts`
- Contains the actual simulation logic as pure functions:
- `createInitialRuntime(program)`
- `stepRuntime(program, runtime)`
- `canStep(program, runtime)`
- `readCurrentSymbol(program, runtime)`

Important: `stepRuntime` should not throw on a missing transition. Instead, it should return a new `runtime` with `halted: true` and `haltReason: { type: "missing_transition", ... }`.

`domain/tmProgramValidation.ts`
- Checks only:
- referential consistency
- symbol/state existence
- allowed formats
- blank symbol rules
- initial tape rules
- transition targets / write symbols must exist

Should not check:
- completeness of all transition table cells

`application/useTMConfigEditor.ts`
- Encapsulates everything that currently lives inside `TMConfigView`.
- Manages drafts, UI-adjacent editing rules, blocking errors, and commit/discard behavior.
- Exposes a clear API to the view.

`application/tmEditorReducer.ts`
- A reducer for editor actions:
- `renameState`
- `removeState`
- `renameSymbol`
- `removeSymbol`
- `updateTransition`
- `setInitialTape`
- `toggleHaltState`

Important: these commands must preserve referential integrity completely. That is exactly what is currently missing.

`application/useTMSimulator.ts`
- Manages the simulator session:
- current `program`
- `runtime`
- `history`
- `status` (`idle`, `running`, `paused`)
- `speed`
- `play/pause/step/reset/stepBack`

For this case, I would scale back the generic class-based solution and use explicit React state instead. For this concrete use case, that is more transparent than an internal mutable simulator plus hook.

`adapters/tmTableAdapter.ts`
- Builds the table representation from domain data:
- Header
- Rows
- active cell
- potentially edit metadata

Important: the mapping to `TableView` belongs here, not in `domain`.

**Architecture Flow**

Configuration:
- `TMConfigScreen`
- uses `useTMConfigEditor`
- edits a `TMProgramDraft`
- runs `validateTMProgram(draft)` before applying
- result is a valid `TMProgram`

Simulation:
- `TMSimulationScreen`
- uses `useTMSimulator(program)`
- `stepRuntime(program, runtime)` is the only domain simulation logic
- halting reasons are rendered from `runtime.haltReason`

**Most Important Design Decision For Your Case**

Missing transitions should be modeled as a `Halting Reason`, not as a technical error.

So not:
- `errorMessage?: string`
- `ERROR` status in the domain sense

Instead:
- `halted: true`
- `haltReason: missing_transition`

The technical `error` channel should remain reserved for real programming/initialization failures, such as broken configuration or unexpected exceptions.

**What I Would Refactor First In The Current Folder**

1. Split `TMConfig` and `TMState` into `TMProgram` and `TMRuntime`.
2. Replace `TuringMachineSimulator` as a class, or reduce it internally to pure domain functions.
3. Slim down `TMConfigView` and move the editor logic into `useTMConfigEditor` / a reducer.
4. Move `tmTable.ts` out of `model/domain` into `adapters/tmTableAdapter.ts`.
5. Replace `errorMessage` in the domain model with `haltReason`.
6. Keep root-level duplicates such as `TMConfigView.tsx` and `TuringMachineSimulator.ts` only as a clean public API, or remove them entirely.

**Pragmatic Refactoring Path**

1. Introduce new domain types: `TMProgram`, `TMRuntime`, `TMHaltReason`
2. Implement a pure step function
3. Rewire the existing UI to the new runtime model
4. Then extract the editor logic into a reducer/hook
5. Then split out the table adapter cleanly
6. Then add tests

If you want, I can sketch the concrete TypeScript types and the exact files with example function signatures in the next step.

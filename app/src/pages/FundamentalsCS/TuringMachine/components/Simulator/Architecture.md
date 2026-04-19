**Target Architecture**

1. `domain`: pure Turing-machine concepts and rules  
2. `application`: React-facing orchestration for editing and simulation  
3. `presentation`: React components for rendering and user input  
4. `adapters`: mapping domain/application state to generic UI components such as `TableView`

The key domain decisions should be:

- Incomplete transition tables are `valid`.
- A missing transition is `not an exception case`, but a `normal halting condition with a reason`.
- Validation checks `structural consistency`, not completeness of the transition function.
- Static machine definition and runtime state are separate concepts and should be modeled separately.

**Cross-Cutting Constraints**

- The code must be `easy to test`.
- Domain logic, validation, reducers, and adapters should stay `pure` and deterministic wherever possible.
- React hooks should mainly coordinate state and side effects, not contain core business rules.
- Presentation components should stay thin and focus on rendering and event wiring.
- The refactor must continue to use the existing simulator contract from `app/src/types/simulator.ts`.
- Simulator orchestration must therefore implement `ISimulator<TMProgram, TMRuntime>` directly.
- Pure domain functions are still preferred internally, but they must remain compatible with the existing simulator interface.
- UI text must `not` be hardcoded in domain objects, reducers, adapters, or hooks.
- All user-facing text must be managed through the project's existing `i18next` setup in `app/src/i18n`.
- Components should render text via `useTranslation()` / `t("...")`.
- Domain and application layers should return `semantic data`, `issue codes`, or `message keys`, not already localized strings.

**Minimal Proposed Folder Structure**

```text
Simulator/
  TMSimulator.tsx

  domain/
    tmTypes.ts
    tmProgram.ts
    tmRuntime.ts
    tmMachine.ts
    tmProgramValidation.ts

  application/
    useTMSimulator.ts
    useTMConfigEditor.ts
    tmEditorReducer.ts

  adapters/
    tmTableAdapter.ts

  presentation/
    TMConfigView.tsx
    TMSimulationView.tsx
    TMGeneralSettings.tsx
    TMHaltStatesPanel.tsx
    TMTransitionTableEditor.tsx
    TMSimulationStatusCard.tsx
    TMTapeView.tsx

  config/
    defaultTMProgram.ts
```

Important:

- Do `not` introduce extra wrapper files such as `TMSimulatorLayout`, `TMConfigScreen`, `TMSimulationScreen`, or `tmTapeAdapter` unless they gain real responsibility.
- The goal is cleaner boundaries, not a larger number of files.

**Responsibilities**

`domain/tmProgram.ts`
- Defines the static machine program.
- In other words: states, alphabets, blank symbol, start state, halting states, transitions.
- Contains only domain data and small invariant helpers if needed.

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

Important:

- `stepRuntime` should not throw on a missing transition.
- It should return a new runtime with `halted: true` and `haltReason: { type: "missing_transition", ... }`.
- This file must remain free of React and i18n dependencies so it stays trivial to unit-test.

`domain/tmProgramValidation.ts`
- Validates only structural correctness:
- referential consistency
- symbol/state existence
- allowed formats
- blank symbol rules
- initial tape rules
- transition targets and write symbols must exist

It should `not` validate:
- completeness of all transition table cells

It should also `not` throw already localized text.

Recommended shape:

```ts
type TMProgramIssueCode =
  | "initial_state_missing"
  | "halt_state_missing"
  | "blank_symbol_invalid"
  | "transition_unknown_state"
  | "transition_unknown_symbol"
  | "initial_tape_invalid_symbol";

interface TMProgramIssue {
  code: TMProgramIssueCode;
  path?: string;
  params?: Record<string, string>;
}
```

Example API:

- `validateTMProgram(program): TMProgramIssue[]`
- `isTMProgramValid(program): boolean`

This keeps validation testable and translation-friendly.

`application/tmEditorReducer.ts`
- Contains editor actions such as:
- `renameState`
- `removeState`
- `renameSymbol`
- `removeSymbol`
- `updateTransition`
- `setInitialTape`
- `toggleHaltState`

Important:

- These operations must preserve referential integrity completely.
- Renaming or removing a state must update all affected transition targets.
- Renaming or removing a symbol must update all affected write symbols and tape-related references.

`application/useTMConfigEditor.ts`
- Encapsulates the editing workflow that is currently concentrated inside `TMConfigView`.
- Manages drafts, blocking cell errors, commit/discard behavior, and validation before apply.
- Exposes a clear, view-friendly API to the presentation layer.

Important:

- The reducer and helper functions should hold the actual rules.
- The hook should mainly coordinate React state.

`application/useTMSimulator.ts`
- Manages the simulator session:
- current `program`
- current `runtime`
- history
- status (`idle`, `running`, `paused`)
- speed
- `play`, `pause`, `step`, `stepBack`, `reset`

For this simulator, I want pure domain functions internally. However, the refactor must still remain compatible with `ISimulator<TMProgram, TMRuntime>` from `app/src/types/simulator.ts`, through an implementation that satisfies that contract.

Important:

- The hook should expose semantic state, not presentation strings.
- The hook should be testable without rendering the full page.

`adapters/tmTableAdapter.ts`
- Builds the `TableView` data from domain/application state:
- headers
- rows
- active cell
- optionally edit metadata

Important:

- This mapping belongs in an adapter, not in `domain`.
- The adapter should return structural UI data and, if needed, translation keys, not localized strings.

**Input Alphabet Decision**

This needs to be decided explicitly because the current UI does not expose `inputAlphabet` as a separate editor, but it still affects validation.

The input alphabet is for now identical to the tape alphabet, but it is still a separate concept in the domain. For now all Symbols from the transition table and the blank symbol are added.

The code should be prepared for a future where the input alphabet can be edited independently, but for now it is derived from the transition table and blank symbol.

**Architecture Flow**

Configuration:
- `TMConfigView`
- uses `useTMConfigEditor`
- edits a `TMProgramDraft`
- reducer actions update the draft while preserving referential integrity
- `validateTMProgram(draft)` returns structured issues before apply
- result is a valid `TMProgram`

Simulation:
- `TMSimulationView`
- uses `useTMSimulator(program)`
- `stepRuntime(program, runtime)` is the only domain simulation logic
- halting reasons are rendered from `runtime.haltReason`

Text handling:
- components translate labels, buttons, helper text, validation messages, and halting messages through `i18next`
- locale entries live in the existing translation resources under `app/src/i18n/locales/.../translation.json`
- simulator-specific copy should be added there as stable keys instead of inline strings

**Most Important Design Decision For This Case**

Missing transitions should be modeled as a `halting reason`, not as a technical error.

So not:
- `errorMessage?: string`
- `ERROR` status in the domain sense

Instead:
- `halted: true`
- `haltReason: { type: "missing_transition", ... }`

The technical `error` channel should remain reserved for real programming or initialization failures, such as broken configuration wiring or unexpected exceptions.

**Compatibility Constraint**

- The refactor must preserve compatibility with the shared simulator interface in `app/src/types/simulator.ts`.
- Internal architecture may move toward pure functions and thinner React hooks, but integration with the rest of the app must still work through `ISimulator<TMProgram, TMRuntime>`.

**What I Would Refactor First In The Current Folder**

1. Split `TMConfig` and `TMState` into `TMProgram` and `TMRuntime`.
2. Introduce pure runtime functions in `tmMachine.ts`.
3. Replace domain-level `errorMessage` with `haltReason`.
4. Move table-building code into `adapters/tmTableAdapter.ts`.
5. Extract editor logic from `TMConfigView` into `tmEditorReducer.ts` and `useTMConfigEditor.ts`.
6. Replace thrown validation strings with structured validation issues.
7. Route all simulator UI text through `i18next` keys in the locale files.
8. Remove or keep root-level re-export files only if they provide a clean public API.

**Pragmatic Refactoring Path**

1. Introduce new domain types: `TMProgram`, `TMRuntime`, `TMHaltReason`.
2. Implement `createInitialRuntime` and `stepRuntime` as pure functions.
3. Rewire the existing UI to the new runtime model without changing end-user behavior or layout.
4. Extract editor mutations into a reducer that guarantees referential integrity.
5. Wrap the reducer in `useTMConfigEditor`.
6. Move transition-table mapping into `tmTableAdapter.ts`.
7. Replace fallback strings and inline text with real `tm.*` translation keys in `app/src/i18n/locales/.../translation.json`.

**Non-Goals**

- No functional change for the end user.
- No visible UI redesign.
- No extra abstraction layers unless they remove real complexity.
- No translation inside domain logic.

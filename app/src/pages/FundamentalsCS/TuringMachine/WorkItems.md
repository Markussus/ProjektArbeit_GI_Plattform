## Prompt (Gemini 3.1 Pro)
Give me possible WorkItems so I can build a new feature (a simulator with debugger for a Turing machine). The code should be as reusable as possible so that I can reuse parts of the simulator / debugger for other things as well.

The later implementation (NOT NOW) should take place in app/src/pages/FundamentalsCS/TuringMachine.

Analyze the existing project and describe for each WorkItem what needs to be done to ultimately simulate and debug a Turing machine in the frontend. I want the complete process from planning to tests.

## Revised response

### Phase 1: Generic Architecture & State Management (Reusable)
The goal of this phase is to design the "engine" and control unit for *any* simulator (automata, DNF, Turing machines).

**WI-TM-1: Design of the generic Simulator Interface**
* **What to do:** Define TypeScript interfaces (`ISimulator`) in the `types/` folder. A simulator must provide generic methods like `initialize(config, ?state)`, `step()`, `stepBack()`, `reset()`, `getConfig()`, `getCurrentState()`, and `isFinished()`.
  * `getCurrentState()` returns the complete state (e.g., tape, head position, current state for TM; `initialize(config, ?state)` can then also work with this information), so the UI always has everything to render or one can export it.
* **Why:** Separation of pure machine logic and React UI. Other concepts (Moore/Mealy) can later implement the same interface.

**WI-TM-2: Implementation of the `useSimulationEngine` Hook (Generic Debugger Hook)**
* **What to do:** Create a React hook that manages the status (`IDLE`, `RUNNING`, `PAUSED`, `ERROR`), the execution speed (`speed` or ticks interval), and the execution loop (e.g., using `requestAnimationFrame` or `setInterval`). The hook triggers the `step()` function of the interface defined in WI-TM-1, manages start/stop as well as error boundaries when a machine crashes.
* **Why:** The Play/Pause/Step logic never needs to be written again for any other automaton.

---

### Phase 2: Business Logic of the Turing Machine (Specific)
This layer will be pure TypeScript logic, untouched by React, to ensure maximum testability.

**WI-TM-3: Define data models of the Turing Machine**
* **What to do:** Define classes or type structures for: The infinite tape (`Tape`, e.g., implemented as two arrays, doubly linked list or sparse map), the read/write head (`Head` position), the set of states `Q`, the alphabet `Sigma`/`Gamma` and the transition function (`delta`-Table).

**WI-TM-4: Program the simulator logic of the Turing Machine**
* **What to do:** Write a class `TuringMachineSimulator` that implements the interface from WI-TM-1. The core is the `step()` method:
  1. Read symbol at head position
  2. Look up current state + symbol in transition table
  3. Write new symbol
  4. Move head (Left, Right, Neutral)
  5. Change state or throw error/breakpoint

---

### Phase 3: Generic UI Components (Reusable)
Here we build views that can be used directly as "debugger" and "visualization" for other features as well.

**WI-TM-5: Development of the generic Debugger Toolbar (`SimulatorControls.tsx`)**
* **What to do:** Create a UI component (in `app/src/components/shared/SimulatorControls/`). This contains buttons for Play, Pause, Step forward, Step backward (if state history is saved, very useful for debugging!) and Restart. Moreover, a slider for the simulation speed.
  * Step backward will not be implemented and also not prepared in the UI -> Coordinate if the feature is relevant
* **Why:** Can be reused directly in `FundamentalsCS/FiniteAutomata` or `MooreMealy`.

**WI-TM-6: Generic Tape/Array Visualization (`ArrayView.tsx`)**
* **What to do:** Build a component for a (seemingly) infinite array (in `app/src/components/shared/ArrayVisual/`). It must be visually scrollable/movable and highlight one element (the head) in color ("Focus").
* **Why:** A tape is used for the Turing machine, but array representations (or stacks) occur everywhere in computer science studies.

**WI-TM-7: Generic State / Transition Table Component (`TableView.tsx`)**
* **What to do:** A component that displays tabular transitions and can highlight the *currently executing row / column / cell* in color (e.g., when the state is currently changing; in `app/src/components/shared/TableVisual/`). The user can add rows / columns, if this is allowed via props.
* **Why:** Transition tables are not only relevant for Turing machines, but also for finite automata, Moore/Mealy automata, etc.

---

### Phase 4: Specific Turing Machine UI
Here you use the workspace in `app/src/pages/FundamentalsCS/TuringMachine`.

**WI-TM-8: Turing Machine Configuration View**
* **What to do:** Build forms under `app/src/pages/FundamentalsCS/TuringMachine/components/` so that students can configure their machine (add transitions, set start state, write start word on the tape). For the state table, the technical note below must be observed.

**WI-TM-9: Merge into TuringMachine Workspace**
* **What to do:** Create the layout for the Turing machine. Top/Center the tape visualization (WI-TM-6), bottom the debugging controls (WI-TM-5) and next to it the transition table (WI-TM-7). Everything is connected with the hook from WI-TM-2 and the instance from WI-TM-4.

---

### Phase 5: Integration & Preparation
**WI-TM-10: Page Integration (`SimulationTab.tsx`)**
* **What to do:** Hook the finished components into the usual structure. Use of the existing `TopicSimulationTab` and `TopicExercisesTab` components.

**WI-TM-11: Internationalization (i18n)**
* **What to do:** Enter terms like "transition function", "tape", "read/write head", "halt state" as keys in `app/src/i18n/locales/de/translation.json` and `en/translation.json`.

---

### Phase 6: Tests & Quality Assurance
**WI-TM-12: Unit Tests for Core Engine (Turing Logic)**
* **What to do:** Develop test cases (e.g., in `TuringMachine.test.ts`) for the logic (WI-TM-4) isolated from React.
  - *Example test:* Execute machine that converts all '0's to '1's. Expect the correct final tape after `isFinished()`.
  - *Example test:* Provoke a crash (transition not defined), test run demands correct error.

**WI-TM-13: Testing the generic Simulator Hook**
* **What to do:** Test `useSimulationEngine` with fake timers (like `vitest.useFakeTimers()`) to check if start/stop events fire correctly into the hook states.

**WI-TM-14: UI / Component Tests of the Debugger Toolbar**
* **What to do:** Testing-Library tests for clicking Play, Pause, Step and checking if the matching mock callbacks of the engine are fired exactly 1 time per click/interval.

---

### Technical Note on the Table for the Turing Machine:
The **header row** consists of the columns:

1. **δ** (delta symbol)

  * This first column is the **input symbol column**.
  * It contains the currently read tape symbol of the Turing machine per row, so for example `0`, `1` or the empty/blank symbol.
  * It can contain each symbol of the alphabet only once.

2. **$q_n$** (State-N)

  * This column stands for the State-N.
  * In the cell of this column and a specific symbol row, it says what the Turing machine should do **if it is in state $q_n$ and reads exactly this tape symbol**.

**Important Format for the Cells in the State Columns**

* Each cell should contain a transition triple in parentheses.
* The format is:

`(Next State, Write Symbol, Movement)`

**Order is important**

1. **Next State** - which state to switch to
2. **Write Symbol** - which symbol is written on the tape
3. **Movement** - head movement, typically `L` or `R`

**Example for the Format**

* `(q1, 0, R)`
* Meaning:

  * go into state `q1`
  * write `0`
  * move the head to the right

**Display Note**

* The state names in the header row should appear as `q` with an underscore number, e.g., `q₀`, `q₁`, `q₂`.
* The same applies in the table entries for next states, if mathematical notation is desired.


### Further Ideas

*Markus & Richard Notes*:

* At the bottom edge of the page a generic Export / Import row
  * Export / Import with and without alias names for states
  * Probably works with its own highly compressed format (e.g., bitwise encoding of the transition table) and then Base64 string for the user, so the data size remains small.

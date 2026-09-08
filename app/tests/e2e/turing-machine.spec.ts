import { expect, test, type Locator, type Page } from "@playwright/test";
import { exportActiveSimulator } from "./support/app-shell";

const TURING_MACHINE_ROUTE = "/gi_learningtool/fundamentals-cs/turing-machine";
const ERASE_TAPE_EXERCISE_ID = "turing-machine.exercises.exerciseEraseTape";
const INVERT_BINARY_WORD_EXERCISE_ID =
  "turing-machine.exercises.exerciseInvertBinaryWord";
const UNARY_INCREMENT_EXERCISE_ID =
  "turing-machine.exercises.exerciseUnaryIncrement";
const BINARY_INCREMENT_EXERCISE_ID =
  "turing-machine.exercises.exerciseBinaryIncrement";
const ADD_BINARY_EXERCISE_ID = "turing-machine.exercises.exerciseAddBinary";
const CHECK_REGEX_EXERCISE_ID = "turing-machine.exercises.exerciseCheckRegex";
const BIT_FLIP_EXAMPLE_ID = "turing-machine.examples.example1";
const UNARY_INCREMENT_EXAMPLE_ID = "turing-machine.examples.example2";
const BINARY_INCREMENT_EXAMPLE_ID = "turing-machine.examples.example3";
const ADD_BINARY_EXAMPLE_ID = "turing-machine.examples.example4";
const BLANK_SYMBOL = "\u25ca";
const Q1_SUBSCRIPT = "q\u2081";

async function gotoTuringMachinePage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("i18nextLng", "en");
  });

  await page.goto(TURING_MACHINE_ROUTE);

  await expect(page.getByTestId("tm-page")).toBeVisible();
}

async function openSimulationTab(page: Page) {
  await switchTab(page, "simulation");

  await expect(page.getByTestId("tm-config-view")).toBeVisible();
}

async function switchTab(
  page: Page,
  tab: "overview" | "exercises" | "examples" | "simulation",
) {
  await page.getByTestId(`tab-button-${tab}`).click();
}

async function openExerciseInSimulation(page: Page, exerciseId: string) {
  await switchTab(page, "exercises");
  await expect(page.getByTestId("tm-exercises-tab")).toBeVisible();
  await page.getByTestId(`tm-exercise-card-${exerciseId}-select`).click();
  await page.getByTestId(`tm-exercise-card-${exerciseId}-open`).click();

  await expect(
    page.getByTestId("simulation-selected-exercise"),
  ).toHaveAttribute("data-item-id", exerciseId);
  await expect(page.getByTestId("tm-simulator")).toHaveAttribute(
    "data-scenario-id",
    exerciseId,
  );
  await expect(page.getByTestId("tm-load-solution")).toBeEnabled();
  await expect(page.getByTestId("tm-check-solution")).toBeEnabled();
}

async function openExampleInSimulation(page: Page, exampleId: string) {
  await switchTab(page, "examples");
  await expect(page.getByTestId("tm-examples-tab")).toBeVisible();
  await page.getByTestId(`tm-example-card-${exampleId}-select`).click();
  await page.getByTestId(`tm-example-card-${exampleId}-open`).click();

  await expect(
    page.getByTestId("simulation-selected-exercise"),
  ).toHaveAttribute("data-item-id", exampleId);
  await expect(page.getByTestId("tm-simulator")).toHaveAttribute(
    "data-scenario-id",
    exampleId,
  );
  await expect(page.getByTestId("tm-config-view")).toBeVisible();
}

async function loadSolution(page: Page) {
  await expect(page.getByTestId("tm-load-solution")).toBeEnabled();
  await page.getByTestId("tm-load-solution").click();
}

async function checkLoadedSolutionPasses(page: Page) {
  await expect(page.getByTestId("tm-check-solution")).toBeEnabled();
  await page.getByTestId("tm-check-solution").click();
  await expect(page.getByTestId("tm-solution-check-dialog")).toBeVisible();
  await expect(page.getByTestId("tm-solution-check-error")).toHaveCount(0);
  await expect(solutionRowsByPassed(page, false)).toHaveCount(0);
  await expect(solutionRows(page).first()).toHaveAttribute(
    "data-passed",
    "true",
  );
  await page.getByTestId("tm-solution-check-dialog-close").click();
  await expect(page.getByTestId("tm-solution-check-dialog")).toHaveCount(0);
}

async function startSimulation(page: Page) {
  await page.getByTestId("tm-start-simulation").click();
  await expect(page.getByTestId("tm-simulation-view")).toBeVisible();
}

async function stepForward(page: Page, count: number) {
  for (let step = 0; step < count; step += 1) {
    await page.getByTestId("tm-simulator-controls-step").click();
  }
}

async function expectTapeWord(page: Page, expectedWord: string) {
  for (const [index, expectedSymbol] of Array.from(expectedWord).entries()) {
    await expect(page.getByTestId(`tm-tape-cell-value-${index}`)).toHaveText(
      expectedSymbol,
    );
  }
}

function transitionTable(page: Page): Locator {
  return page.getByTestId("tm-transition-table");
}

function transitionCellInput(page: Page, row: number, column: number): Locator {
  return page.getByTestId(`tm-transition-table-cell-input-${row}-${column}`);
}

function transitionHeaderInput(page: Page, column: number): Locator {
  return page.getByTestId(`tm-transition-table-header-input-${column}`);
}

function transitionRemoveRows(page: Page): Locator {
  return page.locator('[data-testid^="tm-transition-table-remove-row-"]');
}

function solutionRows(page: Page): Locator {
  return page.locator('[data-testid^="tm-solution-check-table-row-"]');
}

function solutionRowsByPassed(page: Page, passed: boolean): Locator {
  return page.locator(
    `[data-testid^="tm-solution-check-table-row-"][data-passed="${passed}"]`,
  );
}

function solutionRowsByValidHaltState(
  page: Page,
  validHaltState: boolean,
): Locator {
  return page.locator(
    `[data-testid^="tm-solution-check-table-row-"][data-valid-halt-state="${validHaltState}"]`,
  );
}

test.describe("Turing Machine page", () => {
  // Tests the tab navigation and the video overview that frames the topic page.
  test("shows the topic overview and switches between the top-level tabs", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);

    await expect(page.getByTestId("tm-tutorial-video")).toBeVisible();

    await page.getByTestId("tab-button-examples").click();
    await expect(page.getByTestId("tm-examples-tab")).toBeVisible();
    await expect(
      page.getByTestId(`tm-example-card-${BIT_FLIP_EXAMPLE_ID}-select`),
    ).toBeVisible();

    await page.getByTestId("tab-button-overview").click();
    await expect(page.getByTestId("tm-tutorial-video")).toBeVisible();
  });

  // Tests exercise selection, opening an exercise in the simulator, and the simulation focus toggle workflow.
  test("opens an exercise in the simulation workspace and toggles focus mode", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);

    await openExerciseInSimulation(page, ERASE_TAPE_EXERCISE_ID);
    await expect(page.getByTestId("tm-load-solution")).toBeVisible();
    await expect(page.getByTestId("tm-check-solution")).toBeVisible();
    await expect(page.getByTestId("tm-initial-tape-input")).toHaveValue("");

    await loadSolution(page);
    await expect(page.getByTestId("tm-initial-tape-input")).toHaveValue(
      "10110",
    );

    await page.getByTestId("tm-check-solution").click();
    const solutionCheckDialog = page.getByTestId("tm-solution-check-dialog");
    await expect(solutionCheckDialog).toBeVisible();
    await expect(solutionRows(page).first()).toHaveAttribute(
      "data-passed",
      "true",
    );
    await expect(solutionRows(page).first()).toHaveAttribute(
      "data-valid-halt-state",
      "true",
    );
    await expect(
      page.getByTestId("tm-solution-check-dialog-close"),
    ).toBeVisible();
    await page.getByTestId("tm-solution-check-dialog-close").click();

    const focusToggle = page.getByTestId("simulation-focus-toggle");
    await focusToggle.click();
    await expect(focusToggle).toHaveAttribute("aria-pressed", "true");

    await page.getByTestId("tab-button-overview").click();
    await expect(page.getByTestId("module-tab-exit-confirm")).toHaveCount(0);
    await expect(page.getByTestId("tm-tutorial-video")).toBeVisible();
  });

  test("always reloads examples from their built-in program without storing changes", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);
    await openSimulationTab(page);

    await page.getByTestId("tm-initial-tape-input").fill("11111");
    await exportActiveSimulator(page);

    await openExampleInSimulation(page, BIT_FLIP_EXAMPLE_ID);
    await expect(page.getByTestId("tm-initial-tape-input")).toHaveValue(
      "101001",
    );
    const storedFreeSimulation = await page.evaluate(() =>
      window.localStorage.getItem("TrainingCenterStorage"),
    );

    await page.getByTestId("tm-initial-tape-input").fill("000");
    await expect(exportActiveSimulator(page)).resolves.toMatch(
      /^AA[A-Za-z0-9_-]+$/,
    );

    await switchTab(page, "overview");
    await switchTab(page, "examples");
    await page
      .getByTestId(`tm-example-card-${BIT_FLIP_EXAMPLE_ID}-select`)
      .click();
    await page
      .getByTestId(`tm-example-card-${BIT_FLIP_EXAMPLE_ID}-open`)
      .click();

    await expect(page.getByTestId("tm-initial-tape-input")).toHaveValue(
      "101001",
    );
    expect(
      await page.evaluate(() =>
        window.localStorage.getItem("TrainingCenterStorage"),
      ),
    ).toBe(storedFreeSimulation);
  });

  test("returns to the free simulator after leaving an exercise simulation", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);
    await openExerciseInSimulation(page, ERASE_TAPE_EXERCISE_ID);

    await switchTab(page, "overview");
    await switchTab(page, "simulation");

    await expect(page.getByTestId("simulation-selected-exercise")).toHaveCount(
      0,
    );
    await expect(page.getByTestId("tm-simulator")).toHaveAttribute(
      "data-scenario-id",
      "",
    );
  });

  test("resets the current exercise and deletes only its saved state", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);
    await openExerciseInSimulation(page, ERASE_TAPE_EXERCISE_ID);

    await page.getByTestId("tm-initial-tape-input").fill("101");
    await expect(exportActiveSimulator(page)).resolves.toMatch(
      /^AAG[A-Za-z0-9_-]+$/,
    );

    await page.getByTestId("simulation-reset").click();

    await expect(page.getByTestId("tm-initial-tape-input")).toHaveValue("");
    expect(
      await page.evaluate(() =>
        window.localStorage.getItem("TrainingCenterStorage"),
      ),
    ).toBeNull();
  });

  test("resets all TM exercises while preserving the free simulator", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);
    await page.evaluate(() => {
      window.localStorage.setItem(
        "TrainingCenterStorage",
        JSON.stringify(["AAAexercise-0", "AABexercise-1", "AA_free-simulator"]),
      );
    });

    await switchTab(page, "exercises");
    await page.getByTestId("tm-reset-all-exercises").click();
    await page.getByTestId("tm-reset-all-exercises-confirm").click();

    expect(
      await page.evaluate(() =>
        JSON.parse(
          window.localStorage.getItem("TrainingCenterStorage") ?? "[]",
        ),
      ),
    ).toEqual(["AA_free-simulator"]);
  });

  // Tests the validation regression where the currently edited tape must not limit which symbols are accepted during solution checking.
  test("checks a loaded solution successfully even after the editor tape is cleared", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);

    await openExerciseInSimulation(page, INVERT_BINARY_WORD_EXERCISE_ID);

    await loadSolution(page);
    await page.getByTestId("tm-initial-tape-input").fill("");
    await page.getByTestId("tm-check-solution").click();

    await expect(page.getByTestId("tm-solution-check-dialog")).toBeVisible();
    await expect(page.getByTestId("tm-solution-check-error")).toHaveCount(0);
    await expect(solutionRows(page).first()).toHaveAttribute(
      "data-passed",
      "true",
    );
    await expect(solutionRowsByPassed(page, false)).toHaveCount(0);
  });

  // Tests that solution grading now requires a valid halt state instead of treating matching output alone as a PASS.
  test("fails solution checks that end with a missing transition even when the tape output matches", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);

    await openExerciseInSimulation(page, ERASE_TAPE_EXERCISE_ID);

    await loadSolution(page);
    const blankTransitionCell = transitionCellInput(page, 1, 2);
    await blankTransitionCell.fill("");
    await blankTransitionCell.blur();
    await page.getByTestId("tm-check-solution").click();

    await expect(page.getByTestId("tm-solution-check-dialog")).toBeVisible();
    await expect(solutionRowsByPassed(page, false)).not.toHaveCount(0);
    await expect(solutionRowsByPassed(page, true)).toHaveCount(0);
    await expect(solutionRowsByValidHaltState(page, false)).not.toHaveCount(0);
  });

  // Tests the configuration editor controls for tape input, state selection, halt states, row/column management, and protected removal alerts.
  test("edits the machine configuration through the visible editor controls", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);
    await openSimulationTab(page);

    const initialTapeInput = page.getByTestId("tm-initial-tape-input");

    await initialTapeInput.fill("10102");
    await expect(initialTapeInput).toHaveValue("10102");
    await expect(page.getByTestId("tm-tape-alphabet-symbol-2")).toBeVisible();

    await transitionTable(page)
      .getByTestId("tm-transition-table-add-column")
      .click();
    await expect(transitionHeaderInput(page, 3)).toHaveValue(Q1_SUBSCRIPT);
    await transitionHeaderInput(page, 3).fill("qAccept");
    await expect(transitionHeaderInput(page, 3)).toHaveValue("qAccept");

    await page.getByTestId("tm-start-state-select").click();
    await page.getByTestId("tm-start-state-option-qAccept").click();
    await expect(page.getByTestId("tm-start-state-select")).toHaveAttribute(
      "data-value",
      "qAccept",
    );

    const addHaltStateInput = page.getByTestId("tm-add-halt-state-input");
    await addHaltStateInput.fill("q9");
    await addHaltStateInput.press("Enter");
    await expect(addHaltStateInput).toHaveValue("");
    await expect(page.getByTestId("tm-halt-state-q9")).toBeVisible();

    await expect(
      page.getByTestId("tm-transition-table-remove-row-1"),
    ).toHaveCount(1);
    await expect(transitionRemoveRows(page)).toHaveCount(3);

    await transitionTable(page)
      .getByTestId("tm-transition-table-add-row")
      .click();
    await expect(transitionRemoveRows(page)).toHaveCount(4);

    await transitionTable(page)
      .getByTestId("tm-transition-table-remove-row-4")
      .click();
    await expect(transitionRemoveRows(page)).toHaveCount(3);

    await transitionTable(page)
      .getByTestId("tm-transition-table-remove-column-3")
      .click({ force: true });
    await expect(transitionHeaderInput(page, 3)).toHaveCount(0);

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await transitionTable(page)
      .getByTestId("tm-transition-table-remove-row-1")
      .click({ force: true });

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await transitionTable(page)
      .getByTestId("tm-transition-table-remove-column-1")
      .click({ force: true });
  });

  // Tests that the keyboard-friendly blank alias is accepted in visible tape and transition inputs.
  test("accepts <> as the blank symbol in tape and transition inputs", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);
    await openSimulationTab(page);

    const initialTapeInput = page.getByTestId("tm-initial-tape-input");
    await initialTapeInput.fill("<>");
    await expect(initialTapeInput).toHaveValue(BLANK_SYMBOL);

    const blankTransitionCell = transitionCellInput(page, 1, 2);
    await blankTransitionCell.fill("(qS, <>, N)");
    await blankTransitionCell.blur();
    await expect(blankTransitionCell).toHaveValue(`(qS, ${BLANK_SYMBOL}, N)`);

    await expect(page.getByTestId("tm-input-alphabet-symbol-◊")).toBeVisible();
    await expect(page.getByTestId("tm-start-simulation")).toBeEnabled();

    await startSimulation(page);
    await page.getByTestId("tm-simulator-controls-play").click();
    await expect(page.getByTestId("tm-simulation-view")).toBeVisible();
    await expect(page.getByTestId("tm-config-view")).toHaveCount(0);
    await page.getByTestId("tm-simulator-controls-pause").click();
    await page.getByTestId("tm-simulator-controls-step").click();

    await expect(page.getByTestId("tm-status-card")).toHaveAttribute(
      "data-current-state",
      "qS",
    );
    await expect(page.getByTestId("tm-status-card")).toHaveAttribute(
      "data-halted",
      "true",
    );
  });

  // Tests cell-level validation errors, the blocking editor state, and program-level validation before the configuration can be applied.
  test("validates invalid symbol, transition, and program configurations before starting the simulation", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);
    await openSimulationTab(page);

    const startSimulationButton = page.getByTestId("tm-start-simulation");

    const tapeSymbolCell = transitionCellInput(page, 2, 1);
    await tapeSymbolCell.fill("ab");
    await tapeSymbolCell.blur();

    await expect(page.getByTestId("tm-config-error")).toBeVisible();
    await expect(startSimulationButton).toBeDisabled();
    await expect(page.getByTestId("tm-initial-tape-input")).toBeDisabled();

    await tapeSymbolCell.fill("x");
    await tapeSymbolCell.blur();
    await expect(page.getByTestId("tm-config-error")).toHaveCount(0);
    await expect(startSimulationButton).toBeEnabled();

    const transitionCell = transitionCellInput(page, 2, 2);
    await transitionCell.fill("invalid");
    await transitionCell.blur();

    await expect(page.getByTestId("tm-config-error")).toBeVisible();
    await expect(startSimulationButton).toBeDisabled();

    await transitionCell.fill("(qH, 1, R)");
    await transitionCell.blur();
    await expect(page.getByTestId("tm-config-error")).toHaveCount(0);
    await expect(startSimulationButton).toBeEnabled();

    await page.getByTestId("tm-halt-state-qS").click();
    await startSimulationButton.click();

    await expect(page.getByTestId("tm-config-error")).toBeVisible();

    await page.getByTestId("tm-halt-state-qS").click();

    await page.getByTestId("tm-initial-tape-input").fill("1");

    const blankTransitionCell = transitionCellInput(page, 1, 2);
    await blankTransitionCell.fill("(qS, 1, N)");
    await blankTransitionCell.blur();

    await transitionCell.fill("");
    await transitionCell.blur();

    const unaryLoopCell = transitionCellInput(page, 3, 2);
    await unaryLoopCell.fill("(q0, 1, R)");
    await unaryLoopCell.blur();

    await startSimulationButton.click();

    await expect(page.getByTestId("tm-simulation-view")).toBeVisible();
  });

  // Tests the simulator runtime controls in simulation mode, including step, step back, reset, play/pause, speed changes, and returning to edit mode.
  test("runs the simulator controls and reports runtime state changes", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);

    await page.getByTestId("tab-button-examples").click();
    await page
      .getByTestId(`tm-example-card-${BIT_FLIP_EXAMPLE_ID}-select`)
      .click();
    await page
      .getByTestId(`tm-example-card-${BIT_FLIP_EXAMPLE_ID}-open`)
      .click();

    await page.getByTestId("tm-start-simulation").click();

    await expect(page.getByTestId("tm-simulation-view")).toBeVisible();
    const statusCard = page.getByTestId("tm-status-card");
    await expect(statusCard).toHaveAttribute("data-current-state", "q0");
    await expect(statusCard).toHaveAttribute("data-step-count", "0");
    await expect(statusCard).toHaveAttribute("data-halted", "false");

    const speedSlider = page.getByTestId("tm-simulator-controls-speed");
    await speedSlider.evaluate((element) => {
      const input = element as HTMLInputElement;
      input.value = "100";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(speedSlider).toHaveValue("100");

    await page.getByTestId("tm-simulator-controls-play").click();
    await expect(page.getByTestId("tm-simulator-controls-pause")).toBeVisible();
    await expect(
      page.getByTestId("tm-simulator-controls-step-back"),
    ).toBeDisabled();
    await page.getByTestId("tm-simulator-controls-pause").click();
    await expect(page.getByTestId("tm-simulator-controls-play")).toBeVisible();

    await page.getByTestId("tm-simulator-controls-step").click();
    await expect(statusCard).toHaveAttribute("data-step-count", "1");
    await expect(statusCard).toHaveAttribute("data-current-symbol", "0");

    await page.getByTestId("tm-simulator-controls-step-back").click();
    await expect(statusCard).toHaveAttribute("data-step-count", "0");
    await expect(statusCard).toHaveAttribute("data-current-symbol", "1");

    for (let step = 0; step < 7; step += 1) {
      await page.getByTestId("tm-simulator-controls-step").click();
    }

    await expect(statusCard).toHaveAttribute("data-current-state", "qS");
    await expect(statusCard).toHaveAttribute("data-step-count", "7");
    await expect(statusCard).toHaveAttribute("data-halted", "true");

    await page.getByTestId("tm-simulator-controls-reset").click();
    await expect(statusCard).toHaveAttribute("data-current-state", "q0");
    await expect(statusCard).toHaveAttribute("data-step-count", "0");
    await expect(statusCard).toHaveAttribute("data-halted", "false");

    await page.getByTestId("tm-edit-configuration").click();
    await expect(page.getByTestId("tm-config-view")).toBeVisible();
  });

  // Tests all bundled example cards can open in the simulator and produce a runnable configuration.
  test("opens every bundled example in the simulation workspace", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);

    for (const exampleId of [
      BIT_FLIP_EXAMPLE_ID,
      UNARY_INCREMENT_EXAMPLE_ID,
      BINARY_INCREMENT_EXAMPLE_ID,
      ADD_BINARY_EXAMPLE_ID,
    ]) {
      await openExampleInSimulation(page, exampleId);
      await startSimulation(page);
      await expect(page.getByTestId("tm-status-card")).toHaveAttribute(
        "data-step-count",
        "0",
      );
      await expect(page.getByTestId("tm-status-card")).toHaveAttribute(
        "data-halted",
        "false",
      );
      await page.getByTestId("tm-edit-configuration").click();
      await expect(page.getByTestId("tm-config-view")).toBeVisible();
    }
  });

  // Tests representative easy and hard exercise solutions through the full load-and-check workflow.
  test("loads and checks several exercise solutions successfully", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);

    for (const exerciseId of [
      ERASE_TAPE_EXERCISE_ID,
      INVERT_BINARY_WORD_EXERCISE_ID,
      UNARY_INCREMENT_EXERCISE_ID,
      BINARY_INCREMENT_EXERCISE_ID,
      ADD_BINARY_EXERCISE_ID,
      CHECK_REGEX_EXERCISE_ID,
    ]) {
      await openExerciseInSimulation(page, exerciseId);
      await loadSolution(page);
      await checkLoadedSolutionPasses(page);
    }
  });

  // Tests building the bit-inverter machine from the blank simulator instead of loading an example or solution.
  test("builds and runs a bit inverter from scratch", async ({ page }) => {
    await gotoTuringMachinePage(page);
    await openSimulationTab(page);

    await page.getByTestId("tm-initial-tape-input").fill("101001");

    await transitionCellInput(page, 1, 2).fill(`(qS, ${BLANK_SYMBOL}, N)`);
    await transitionCellInput(page, 1, 2).blur();
    await transitionCellInput(page, 2, 2).fill("(q0, 1, R)");
    await transitionCellInput(page, 2, 2).blur();
    await transitionCellInput(page, 3, 2).fill("(q0, 0, R)");
    await transitionCellInput(page, 3, 2).blur();

    await startSimulation(page);
    await stepForward(page, 7);

    await expect(page.getByTestId("tm-status-card")).toHaveAttribute(
      "data-current-state",
      "qS",
    );
    await expect(page.getByTestId("tm-status-card")).toHaveAttribute(
      "data-step-count",
      "7",
    );
    await expect(page.getByTestId("tm-status-card")).toHaveAttribute(
      "data-halted",
      "true",
    );
    await expectTapeWord(page, "010110");
  });
});

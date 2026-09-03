import { expect, test, type Page } from "@playwright/test";

const ROUTE = "/fundamentals-cs/moore-mealy";

async function preparePage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem("i18nextLng", "en");
  });
  await page.goto(ROUTE);
}

async function openEmptySimulator(page: Page) {
  await preparePage(page);
  await page.getByTestId("tab-button-simulation").click();
  await expect(page.getByTestId("moore-config-view")).toBeVisible();
}

async function openMooreSimulator(page: Page) {
  await preparePage(page);
  await page.getByTestId("tab-button-examples").click();
  await page
    .getByTestId("moore-mealy-example-moore-mealy.examples.mooreDefault-select")
    .click();
  await page
    .getByTestId("moore-mealy-example-moore-mealy.examples.mooreDefault-open")
    .click();
  await expect(page.getByTestId("moore-config-view")).toBeVisible();
}

async function openMealySimulator(page: Page) {
  await preparePage(page);
  await page.getByTestId("tab-button-examples").click();
  await page
    .getByTestId("moore-mealy-example-moore-mealy.examples.mealyDefault-select")
    .click();
  await page
    .getByTestId("moore-mealy-example-moore-mealy.examples.mealyDefault-open")
    .click();
  await expect(page.getByTestId("mealy-config-view")).toBeVisible();
}

async function openExercise(page: Page, exerciseId: string) {
  await page.getByTestId("tab-button-exercises").click();
  await page.getByTestId(`automata-exercise-card-${exerciseId}-select`).click();
  await page.getByTestId(`automata-exercise-card-${exerciseId}-open`).click();
}

test.describe("Moore and Mealy simulation tab", () => {
  test("edits Moore outputs in one state-based row and creates output symbols", async ({
    page,
  }) => {
    await openMooreSimulator(page);

    const table = page.getByTestId("moore-transition-table");
    await expect(table.locator("thead th").first()).toHaveText("");
    await expect(page.getByTestId("moore-output-row")).toContainText(
      "Output λ",
    );
    await expect(
      page.locator('[data-testid^="moore-transition-output-"]'),
    ).toHaveCount(0);

    const output = page.getByTestId("moore-output-symbol-0");
    await output.click();
    await expect(
      page.getByTestId("moore-output-symbol-0-create"),
    ).toBeVisible();
    await expect(
      page.getByTestId("moore-output-symbol-0-create"),
    ).toBeEnabled();
    await page.getByTestId("moore-output-symbol-0-search").fill("TEST");
    await page.keyboard.press("Enter");

    await expect(output).toHaveAttribute("data-value", "TEST");
    await expect(page.getByTestId("moore-output-code-0")).toHaveValue("7");
    await expect(page.getByTestId("moore-output-alphabet")).toContainText(
      "TEST7",
    );

    await page.getByTestId("moore-representation-select").click();
    await page.getByTestId("moore-representation-option-binary").click();
    await expect(page.getByTestId("moore-output-code-0")).toHaveValue("111");
  });

  test("keeps Mealy outputs attached to transition cells", async ({ page }) => {
    await openMealySimulator(page);

    await expect(
      page.getByTestId("mealy-config-view").locator("thead th").first(),
    ).toContainText("Event");
    await expect(
      page.getByTestId("mealy-config-view").getByTestId("moore-output-row"),
    ).toHaveCount(0);
    await page
      .getByTestId("mealy-config-view")
      .getByTestId("moore-add-input-symbol")
      .click();
    await expect(
      page
        .getByTestId("mealy-config-view")
        .locator('[data-testid^="mealy-transition-output-symbol-"]'),
    ).not.toHaveCount(0);
  });

  test("simulates Mealy and renders its graph, conversion, and gate network", async ({
    page,
  }) => {
    await openMealySimulator(page);

    await expect(
      page
        .getByTestId("mealy-config-view")
        .locator('[data-testid^="mealy-transition-output-symbol-"]'),
    ).toHaveCount(6);
    await page.getByTestId("mealy-start-simulation").click();
    await page.getByTestId("mealy-controls-step").click();

    await expect(page.getByTestId("mealy-runtime-output")).toContainText(
      "NO_MATCH",
    );
    await expect(page.getByTestId("mealy-state-diagram")).toBeVisible();
    await expect(
      page
        .getByTestId("mealy-state-diagram")
        .locator('[data-testid^="state-machine-node-"]'),
    ).toHaveCount(3);
    await page.getByTestId("mealy-state-diagram-zoom-in").click();
    await expect(
      page.getByTestId("mealy-state-diagram-zoom-percent-reset"),
    ).toHaveText("130%");

    await page.getByTestId("mealy-open-conversion").click();
    await expect(page.getByTestId("moore-conversion-view")).toBeVisible();
    await expect(
      page.getByTestId("moore-transition-value-table"),
    ).toBeVisible();
    await page.getByTestId("moore-conversion-show-logic").click();

    await expect(page.getByTestId("moore-logic-gate-view")).toBeVisible();
    await expect(page.getByTestId("moore-logic-gate-diagram")).toBeVisible();
    await expect(
      page.locator('[data-testid^="moore-logic-wire-"]'),
    ).not.toHaveCount(0);
    await page.getByTestId("moore-logic-edit-definition").click();
    await expect(page.getByTestId("mealy-config-view")).toBeVisible();
  });

  test("creates states from transition cells and simulates tokenized input", async ({
    page,
  }) => {
    await openMooreSimulator(page);

    const transition = page.getByTestId("moore-transition-0-0");
    await transition.click();
    await page.getByTestId("moore-transition-0-0-search").fill("CLOSED_NEW");
    await page.keyboard.press("Enter");

    await expect(transition).toHaveAttribute("data-value", "CLOSED_NEW");
    await expect(
      page
        .getByTestId("moore-config-view")
        .locator('[data-testid^="moore-state-name-"]'),
    ).toHaveCount(5);

    await page.getByTestId("moore-representation-select").click();
    await page.getByTestId("moore-representation-option-binary").click();
    await expect(page.getByTestId("moore-state-set")).toContainText(
      "CLOSED_NEW100",
    );

    await page
      .getByTestId("moore-input-alphabet")
      .getByTestId("moore-input-token-0")
      .click();
    await page.getByTestId("moore-start-simulation").click();
    await page.getByTestId("moore-controls-step").click();

    await expect(page.getByTestId("moore-simulation-view")).toBeVisible();
    await expect(page.getByTestId("moore-runtime-output")).toContainText(
      "OUT_4",
    );
    await expect(page.getByTestId("moore-state-diagram")).toBeVisible();
  });

  test("leaves the simulation without a warning and restores the local draft", async ({
    page,
  }) => {
    await openEmptySimulator(page);

    const stateName = page
      .getByTestId("moore-config-view")
      .getByTestId("moore-state-name-0");
    await stateName.fill("CLOSED");
    await stateName.press("Enter");
    await page.getByTestId("tab-button-overview").click();

    await expect(page.getByTestId("module-tab-exit-confirm")).toHaveCount(0);

    await page.getByTestId("tab-button-simulation").click();
    await expect(
      page.getByTestId("moore-config-view").getByTestId("moore-state-name-0"),
    ).toHaveValue("CLOSED");
  });

  test("shows separate Moore and Mealy sub-tabs without losing the Moore editor", async ({
    page,
  }) => {
    await openEmptySimulator(page);

    await page.getByTestId("moore-machine-tab-mealy").click();
    await expect(page.getByTestId("mealy-config-view")).toBeVisible();

    await page.getByTestId("moore-machine-tab-moore").click();
    await expect(page.getByTestId("moore-config-view")).toBeVisible();
  });

  test("locks machine type sub-tabs when an example is loaded", async ({
    page,
  }) => {
    await openMooreSimulator(page);
    await expect(page.getByTestId("moore-machine-tab-mealy")).toBeDisabled();

    await openMealySimulator(page);
    await expect(page.getByTestId("moore-machine-tab-moore")).toBeDisabled();
  });

  test("starts both machines empty and resets the active machine", async ({
    page,
  }) => {
    await openEmptySimulator(page);
    await expect(
      page
        .getByTestId("moore-config-view")
        .locator('[data-testid^="moore-state-name-"]'),
    ).toHaveCount(1);

    await page.getByTestId("moore-machine-tab-mealy").click();
    await expect(
      page
        .getByTestId("mealy-config-view")
        .locator('[data-testid^="moore-state-name-"]'),
    ).toHaveCount(1);
    await page
      .getByTestId("mealy-config-view")
      .getByTestId("moore-add-input-symbol")
      .click();
    await expect(
      page
        .getByTestId("mealy-config-view")
        .locator('[data-testid^="moore-input-symbol-"]'),
    ).toHaveCount(1);
    await page.getByTestId("simulation-reset").click();
    await expect(
      page
        .getByTestId("mealy-config-view")
        .locator('[data-testid^="moore-input-symbol-"]'),
    ).toHaveCount(0);
  });

  test("opens the bundled Moore and Mealy defaults from examples", async ({
    page,
  }) => {
    await preparePage(page);
    await page.getByTestId("tab-button-examples").click();
    await expect(
      page.getByTestId("moore-mealy-examples-section-moore"),
    ).toBeVisible();
    await expect(
      page.getByTestId("moore-mealy-examples-section-mealy"),
    ).toBeVisible();

    await page
      .getByTestId(
        "moore-mealy-example-moore-mealy.examples.mooreDefault-select",
      )
      .click();
    await page
      .getByTestId("moore-mealy-example-moore-mealy.examples.mooreDefault-open")
      .click();
    await expect(
      page
        .getByTestId("moore-config-view")
        .locator('[data-testid^="moore-state-name-"]'),
    ).toHaveCount(4);

    await page.getByTestId("tab-button-examples").click();
    await page
      .getByTestId(
        "moore-mealy-example-moore-mealy.examples.mealyDefault-select",
      )
      .click();
    await page
      .getByTestId("moore-mealy-example-moore-mealy.examples.mealyDefault-open")
      .click();
    await expect(page.getByTestId("mealy-config-view")).toBeVisible();
  });

  test("resets examples to their bundled machine definitions", async ({
    page,
  }) => {
    await openMooreSimulator(page);
    const mooreState = page
      .getByTestId("moore-config-view")
      .getByTestId("moore-state-name-0");
    await mooreState.fill("CHANGED");
    await mooreState.press("Enter");
    await page.getByTestId("simulation-reset").click();
    await expect(mooreState).toHaveValue("HALT");

    await page.getByTestId("tab-button-examples").click();
    await page
      .getByTestId(
        "moore-mealy-example-moore-mealy.examples.mealyDefault-select",
      )
      .click();
    await page
      .getByTestId("moore-mealy-example-moore-mealy.examples.mealyDefault-open")
      .click();

    const mealyState = page
      .getByTestId("mealy-config-view")
      .getByTestId("moore-state-name-0");
    await mealyState.fill("CHANGED");
    await mealyState.press("Enter");
    await page.getByTestId("simulation-reset").click();
    await expect(mealyState).toHaveValue("START");
  });

  test("opens all exercises and verifies their bundled solutions", async ({
    page,
  }) => {
    await preparePage(page);
    await page.getByTestId("tab-button-exercises").click();
    await expect(
      page.getByTestId("moore-mealy-exercises-tab-section-moore"),
    ).toBeVisible();
    await expect(
      page.getByTestId("moore-mealy-exercises-tab-section-mealy"),
    ).toBeVisible();
    const exercises = [
      ["moore-mealy.exercises.turnstile.title", "moore-config-view"],
      ["moore-mealy.exercises.elevator.title", "moore-config-view"],
      ["moore-mealy.exercises.barrier.title", "moore-config-view"],
      ["moore-mealy.exercises.vending.title", "moore-config-view"],
      ["moore-mealy.exercises.wiper.title", "moore-config-view"],
      ["moore-mealy.exercises.alarm.title", "moore-config-view"],
      ["moore-mealy.exercises.cruise.title", "moore-config-view"],
      ["moore-mealy.exercises.edgeDetector.title", "mealy-config-view"],
      ["moore-mealy.exercises.doorController.title", "mealy-config-view"],
      ["moore-mealy.exercises.sequenceDetector.title", "mealy-config-view"],
      ["moore-mealy.exercises.parityTracker.title", "mealy-config-view"],
    ];

    for (const [exerciseId, configTestId] of exercises) {
      await openExercise(page, exerciseId);
      await expect(page.getByTestId(configTestId)).toBeVisible();
      await page.getByTestId("automata-load-solution").click();
      await expect(page.getByTestId(configTestId)).toBeVisible();
      await page.getByTestId("automata-check-solution").click();
      await expect(
        page.getByTestId("automata-solution-check-result"),
      ).toHaveAttribute("data-passed", "true");
      await page.getByTestId("automata-solution-check-dialog-close").click();
    }
  });

  test("checks an exercise against its stored solution", async ({ page }) => {
    await preparePage(page);
    await openExercise(page, "moore-mealy.exercises.turnstile.title");
    await expect(
      page
        .getByTestId("moore-config-view")
        .locator('[data-testid^="moore-state-name-"]'),
    ).toHaveCount(1);
    await expect(
      page
        .getByTestId("moore-config-view")
        .locator('[data-testid^="moore-input-symbol-"]'),
    ).toHaveCount(0);

    await page.getByTestId("automata-check-solution").click();
    await expect(
      page.getByTestId("automata-solution-check-result"),
    ).toHaveAttribute("data-passed", "false");
    await expect(
      page.getByTestId("automata-solution-check-table"),
    ).toBeVisible();
    await expect(
      page.locator(
        '[data-testid^="automata-solution-check-table-row-"][data-passed="false"]',
      ),
    ).not.toHaveCount(0);
    await page.getByTestId("automata-solution-check-dialog-close").click();

    await page.getByTestId("automata-load-solution").click();
    await page.getByTestId("automata-check-solution").click();
    await expect(
      page.getByTestId("automata-solution-check-result"),
    ).toHaveAttribute("data-passed", "true");
    await expect(
      page.locator(
        '[data-testid^="automata-solution-check-table-row-"][data-passed="false"]',
      ),
    ).toHaveCount(0);
    await page.getByTestId("automata-solution-check-dialog-close").click();
    await page.getByTestId("simulation-reset").click();
    await expect(
      page
        .getByTestId("moore-config-view")
        .locator('[data-testid^="moore-state-name-"]'),
    ).toHaveCount(1);
    await expect(
      page
        .getByTestId("moore-config-view")
        .locator('[data-testid^="moore-input-symbol-"]'),
    ).toHaveCount(0);
  });

  test("returns to the free simulator after leaving an exercise", async ({
    page,
  }) => {
    await preparePage(page);
    await openExercise(page, "moore-mealy.exercises.turnstile.title");
    await page.getByTestId("automata-load-solution").click();
    await expect(
      page
        .getByTestId("moore-config-view")
        .locator('[data-testid^="moore-state-name-"]'),
    ).toHaveCount(2);

    await page.getByTestId("tab-button-overview").click();
    await page.getByTestId("tab-button-simulation").click();

    await expect(page.getByTestId("simulation-selected-exercise")).toHaveCount(
      0,
    );
    await expect(
      page
        .getByTestId("moore-config-view")
        .locator('[data-testid^="moore-state-name-"]'),
    ).toHaveCount(1);
    await expect(
      page
        .getByTestId("moore-config-view")
        .locator('[data-testid^="moore-input-symbol-"]'),
    ).toHaveCount(0);
  });

  test("persists each exercise and resets all exercise progress", async ({
    page,
  }) => {
    await preparePage(page);
    await openExercise(page, "moore-mealy.exercises.turnstile.title");

    const stateName = page
      .getByTestId("moore-config-view")
      .getByTestId("moore-state-name-0");
    await stateName.fill("SAVED_STATE");
    await stateName.press("Enter");
    await page.getByTestId("tab-button-overview").click();

    await openExercise(page, "moore-mealy.exercises.turnstile.title");
    await expect(
      page.getByTestId("moore-config-view").getByTestId("moore-state-name-0"),
    ).toHaveValue("SAVED_STATE");

    await page.getByTestId("tab-button-exercises").click();
    await page.getByTestId("automata-reset-all-exercises").click();
    await page.getByTestId("automata-reset-all-exercises-confirm").click();
    await openExercise(page, "moore-mealy.exercises.turnstile.title");
    await expect(
      page.getByTestId("moore-config-view").getByTestId("moore-state-name-0"),
    ).toHaveValue("STATE_0");

    await page.getByTestId("tab-button-exercises").click();
    await openExercise(page, "moore-mealy.exercises.edgeDetector.title");
    const mealyStateName = page
      .getByTestId("mealy-config-view")
      .getByTestId("moore-state-name-0");
    await mealyStateName.fill("SAVED_MEALY_STATE");
    await mealyStateName.press("Enter");
    await page.getByTestId("tab-button-overview").click();

    await openExercise(page, "moore-mealy.exercises.edgeDetector.title");
    await expect(
      page.getByTestId("mealy-config-view").getByTestId("moore-state-name-0"),
    ).toHaveValue("SAVED_MEALY_STATE");

    await page.getByTestId("tab-button-exercises").click();
    await page.getByTestId("automata-reset-all-exercises").click();
    await page.getByTestId("automata-reset-all-exercises-confirm").click();
    await openExercise(page, "moore-mealy.exercises.edgeDetector.title");
    await expect(
      page.getByTestId("mealy-config-view").getByTestId("moore-state-name-0"),
    ).toHaveValue("STATE_0");
  });

  test("opens transition/output functions and returns to the editor", async ({
    page,
  }) => {
    await openMooreSimulator(page);

    await page.getByTestId("moore-open-conversion").click();
    await expect(page.getByTestId("moore-conversion-view")).toBeVisible();
    await expect(
      page.getByTestId("moore-transition-value-table"),
    ).toBeVisible();
    await expect(page.getByTestId("moore-formula-canonical-y0")).toHaveCount(0);

    await page.getByTestId("moore-conversion-tab-output").click();
    await expect(page.getByTestId("moore-output-value-table")).toBeVisible();
    await expect(page.getByTestId("moore-formula-canonical-y0")).toBeVisible();

    await page.getByTestId("moore-conversion-edit-definition").click();
    await expect(page.getByTestId("moore-config-view")).toBeVisible();
  });

  test("renders individual gate networks and navigates between simulator views", async ({
    page,
  }) => {
    await openMooreSimulator(page);

    await page.getByTestId("moore-open-logic").click();
    await expect(page.getByTestId("moore-logic-gate-view")).toBeVisible();
    await expect(page.getByTestId("moore-logic-gate-diagram")).toBeVisible();

    await page.getByTestId("moore-logic-formula-y2").click();
    await expect(page.getByTestId("moore-logic-gate-diagram")).toBeVisible();

    await expect(page.getByTestId("moore-show-complete-circuit")).toHaveCount(
      0,
    );
    await page.getByTestId("moore-logic-show-conversion").click();
    await expect(page.getByTestId("moore-conversion-view")).toBeVisible();
    await page.getByTestId("moore-conversion-show-logic").click();
    await page.getByTestId("moore-logic-show-simulator").click();
    await expect(page.getByTestId("moore-simulation-view")).toBeVisible();

    await page.getByTestId("moore-bottom-edit-configuration").click();
    await expect(page.getByTestId("moore-config-view")).toBeVisible();
  });
});

import { expect, test, type Page } from "@playwright/test";

const DNF_ROUTE = "/fundamentals-cs/dnf";
const FIRST_DNF_EXERCISE_ID = "dnf.exercises.worksheet02bTruthTable1.title";
const SIMPLE_EXPRESSION_EXERCISE_ID = "dnf.exercises.simpleExpression.title";
const COMPLEX_DNF_EXERCISE_ID = "dnf.exercises.complexExpression.title";
const LECTURE_EXPRESSION_EXAMPLE_ID = "lecture-expression";
const DNF_INTRO_TABLE_EXAMPLE_ID = "dnf-intro";

async function gotoDnfPage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("i18nextLng", "en");
  });

  await page.goto(DNF_ROUTE);
  await expect(page.getByTestId("dnf-page")).toBeVisible();
}

async function switchTab(
  page: Page,
  tab: "overview" | "exercises" | "examples" | "simulation",
) {
  await page.getByTestId(`tab-button-${tab}`).click();
}

async function openFirstDnfExercise(page: Page) {
  await switchTab(page, "exercises");
  await expect(page.getByTestId("dnf-exercises-tab")).toBeVisible();

  await page
    .getByTestId(`dnf-exercise-card-${FIRST_DNF_EXERCISE_ID}-select`)
    .click();
  await page
    .getByTestId(`dnf-exercise-card-${FIRST_DNF_EXERCISE_ID}-open`)
    .click();

  await expect(
    page.getByTestId("simulation-selected-exercise"),
  ).toHaveAttribute("data-item-id", FIRST_DNF_EXERCISE_ID);
  await expect(page.getByTestId("dnf-simulator")).toHaveAttribute(
    "data-mode",
    "truth_table_to_dnf",
  );
}

test.describe("DNF page", () => {
  test("shows overview, examples, and opens an example in the simulator", async ({
    page,
  }) => {
    await gotoDnfPage(page);

    await expect(page.getByTestId("tab-button-overview")).toBeVisible();
    await expect(page.getByTestId("tab-button-exercises")).toBeVisible();
    await expect(page.getByTestId("tab-button-examples")).toBeVisible();
    await expect(page.getByTestId("tab-button-simulation")).toBeVisible();

    await switchTab(page, "exercises");
    await expect(page.getByTestId("dnf-exercises-tab")).toBeVisible();
    await expect(
      page.getByTestId(`dnf-exercise-card-${FIRST_DNF_EXERCISE_ID}-select`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`dnf-exercise-card-${COMPLEX_DNF_EXERCISE_ID}-select`),
    ).toBeVisible();

    await switchTab(page, "examples");
    await expect(page.getByTestId("dnf-examples-tab")).toBeVisible();
    await expect(
      page.getByTestId(`dnf-example-${LECTURE_EXPRESSION_EXAMPLE_ID}-select`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`dnf-example-${DNF_INTRO_TABLE_EXAMPLE_ID}-select`),
    ).toBeVisible();

    await page
      .getByTestId(`dnf-example-${LECTURE_EXPRESSION_EXAMPLE_ID}-select`)
      .click();
    await page
      .getByTestId(`dnf-example-${LECTURE_EXPRESSION_EXAMPLE_ID}-open`)
      .click();

    await expect(
      page.getByTestId("simulation-selected-exercise"),
    ).toHaveAttribute("data-item-kind", "example");
    await expect(page.getByTestId("dnf-simulator")).toHaveAttribute(
      "data-mode",
      "expression_to_truth_table",
    );
    await expect(page.getByTestId("dnf-expression-input")).not.toHaveValue("");
    await expect(page.getByTestId("dnf-evaluate-expression")).toBeVisible();
    await expect(page.getByTestId("dnf-exercise-workspace")).toHaveCount(0);

    await page.getByTestId("dnf-evaluate-expression").click();
    await expect(page.getByTestId("dnf-exercise-workspace")).toBeVisible();

    await switchTab(page, "examples");
    await page
      .getByTestId(`dnf-example-${DNF_INTRO_TABLE_EXAMPLE_ID}-select`)
      .click();
    await page
      .getByTestId(`dnf-example-${DNF_INTRO_TABLE_EXAMPLE_ID}-open`)
      .click();

    await expect(page.getByTestId("dnf-simulator")).toHaveAttribute(
      "data-mode",
      "truth_table_to_dnf",
    );
    await expect(page.getByTestId("dnf-table-builder-controls")).toBeVisible();
    await expect(page.getByTestId("dnf-variable-count-input")).toHaveValue("3");
    await expect(page.getByTestId("dnf-exercise-workspace")).toHaveCount(0);

    await page.getByRole("button", { name: "Commit table" }).click();
    await expect(page.getByTestId("dnf-exercise-workspace")).toBeVisible();
    await page.getByTestId("dnf-exercise-answer").fill("a");
    await page.getByTestId("simulation-reset").click();
    await expect(page.getByTestId("dnf-simulator")).toHaveAttribute(
      "data-mode",
      "truth_table_to_dnf",
    );
    await expect(page.getByTestId("dnf-exercise-workspace")).toBeVisible();
    await expect(page.getByTestId("dnf-table-builder-controls")).toHaveCount(0);
    await expect(page.getByTestId("dnf-exercise-answer")).toHaveValue("");
  });

  test("covers expression simulation results, compact toggles, and variable limits", async ({
    page,
  }) => {
    await gotoDnfPage(page);
    await switchTab(page, "simulation");

    await page.getByTestId("dnf-expression-input").fill("~a && (b || c)");
    await page.getByTestId("dnf-expression-input").blur();
    await page.getByTestId("dnf-evaluate-expression").click();

    await expect(page.getByTestId("dnf-exercise-workspace")).toBeVisible();
    await expect(page.getByTestId("dnf-reset-answer")).toHaveCount(0);
    await page.getByTestId("dnf-toggle-solution").click();
    await expect(page.getByTestId("dnf-follow-up-solution")).toBeVisible();
    await expect(page.getByTestId("dnf-follow-up-solution-toggle")).toHaveCount(
      0,
    );
    await expect(page.getByTestId("dnf-result-panel")).toBeVisible();
    await expect(
      page.getByTestId("dnf-solution-truth-table-panel"),
    ).toBeVisible();

    await page.getByTestId("dnf-new-expression").click();
    await page
      .getByTestId("dnf-expression-input")
      .fill("a | b | c | d | e | f | g | h | i");
    await page.getByTestId("dnf-evaluate-expression").click();
    await expect(page.getByTestId("dnf-variable-limit-panel")).toBeVisible();
  });

  test("exports and imports a complete free expression session", async ({
    page,
  }) => {
    await gotoDnfPage(page);
    await switchTab(page, "simulation");

    await page.getByTestId("dnf-expression-input").fill("a & b");
    await page.getByTestId("dnf-evaluate-expression").click();
    await page.getByTestId("dnf-result-button-0-1").click();
    await page.getByTestId("dnf-exercise-answer").fill("a");
    await page.getByTestId("dnf-expression-transfer-export").click();

    const transferValue = await page
      .getByTestId("dnf-expression-transfer-input")
      .inputValue();

    expect(transferValue).toMatch(/^[A-Za-z0-9_-]{3}D[A-Za-z0-9_-]+$/u);

    const transferInput = page.getByTestId("dnf-expression-transfer-input");

    await page.getByTestId("dnf-result-button-0-0").click();
    await page.getByTestId("dnf-exercise-answer").fill("b");
    await transferInput.fill("");
    await transferInput.fill(transferValue);
    await page.getByTestId("dnf-expression-transfer-import").click();

    await expect(page.getByTestId("dnf-exercise-workspace")).toBeVisible();
    await expect(page.getByTestId("dnf-result-button-0-1")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByTestId("dnf-exercise-answer")).toHaveValue("a");
  });

  test("restores and resets a complete free table session", async ({
    page,
  }) => {
    await gotoDnfPage(page);
    await switchTab(page, "simulation");

    await page.getByTestId("dnf-mode-tab-truth_table_to_dnf").click();
    await page.getByTestId("dnf-fill-table").click();
    await page.getByRole("button", { name: "Commit table" }).click();
    await page.getByTestId("dnf-exercise-answer").fill("a");
    await page.getByTestId("dnf-table-transfer-export").click();
    await page.reload();
    await switchTab(page, "simulation");

    await expect(page.getByTestId("dnf-simulator")).toHaveAttribute(
      "data-mode",
      "truth_table_to_dnf",
    );
    await expect(page.getByTestId("dnf-exercise-workspace")).toBeVisible();
    await expect(page.getByTestId("dnf-exercise-answer")).toHaveValue("a");

    await page.getByTestId("simulation-reset").click();

    await expect(page.getByTestId("dnf-simulator")).toHaveAttribute(
      "data-mode",
      "truth_table_to_dnf",
    );
    await expect(page.getByTestId("dnf-exercise-workspace")).toBeVisible();
    await expect(page.getByTestId("dnf-table-builder-controls")).toHaveCount(0);
    await expect(page.getByTestId("dnf-exercise-answer")).toHaveValue("");
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.localStorage.getItem("TrainingCenterStorage"),
        ),
      )
      .toBeNull();

    await page.waitForTimeout(10_500);
    expect(
      await page.evaluate(() =>
        window.localStorage.getItem("TrainingCenterStorage"),
      ),
    ).toBeNull();
  });

  test("rejects an exercise transfer string in a different DNF exercise", async ({
    page,
  }) => {
    await gotoDnfPage(page);
    await openFirstDnfExercise(page);

    await page.getByTestId("dnf-exercise-answer").fill("a");
    await page.getByTestId("dnf-exercise-transfer-export").click();
    const firstExerciseTransfer = await page
      .getByTestId("dnf-exercise-transfer-input")
      .inputValue();

    await switchTab(page, "exercises");
    await page.getByRole("button", { name: "Switch Tab" }).click();
    await page
      .getByTestId(`dnf-exercise-card-${SIMPLE_EXPRESSION_EXERCISE_ID}-select`)
      .click();
    await page
      .getByTestId(`dnf-exercise-card-${SIMPLE_EXPRESSION_EXERCISE_ID}-open`)
      .click();

    await page
      .getByTestId("dnf-exercise-transfer-input")
      .fill(firstExerciseTransfer);
    await page.getByTestId("dnf-exercise-transfer-import").click();

    await expect(page.getByTestId("dnf-exercise-transfer-status")).toHaveText(
      /could not be loaded/i,
    );
  });

  test("restores a saved DNF exercise attempt", async ({ page }) => {
    await gotoDnfPage(page);
    await openFirstDnfExercise(page);

    await page.getByTestId("dnf-exercise-answer").fill("a");
    await page.getByTestId("dnf-exercise-transfer-export").click();
    await page.reload();
    await openFirstDnfExercise(page);

    await expect(page.getByTestId("dnf-exercise-answer")).toHaveValue("a");
  });

  test("keeps the simplification reachable after restoring a solved exercise", async ({
    page,
  }) => {
    await gotoDnfPage(page);
    await openFirstDnfExercise(page);

    await page
      .getByTestId("dnf-exercise-answer")
      .fill("(!a & !b & c) | (!a & b & c) | (a & !b & !c) | (a & b & !c)");
    await page.getByTestId("dnf-check-answer").click();
    await expect(page.getByTestId("dnf-exercise-feedback")).toHaveAttribute(
      "data-status",
      "correct",
    );

    await page.getByTestId("dnf-follow-up-simplification-toggle").click();
    await page.getByTestId("dnf-simplified-answer").fill("a");
    await page.getByTestId("dnf-exercise-transfer-export").click();
    await page.reload();
    await openFirstDnfExercise(page);

    // The restored attempt is correct, so the simplification stays unlocked
    // and its answer is restored instead of being lost on reload.
    await expect(
      page.getByTestId("dnf-follow-up-simplification-toggle"),
    ).toBeEnabled();
    await page.getByTestId("dnf-follow-up-simplification-toggle").click();
    await expect(page.getByTestId("dnf-simplified-answer")).toHaveValue("a");
  });

  test("resets all DNF exercises while preserving the free simulator", async ({
    page,
  }) => {
    await gotoDnfPage(page);
    await page.evaluate(() => {
      window.localStorage.setItem(
        "TrainingCenterStorage",
        JSON.stringify([
          "AFAexercise-0",
          "AFBexercise-1",
          "AF_free-simulator",
          "AAAother-topic",
        ]),
      );
    });

    await switchTab(page, "exercises");
    await page.getByTestId("dnf-reset-all-exercises").click();
    await page.getByTestId("dnf-reset-all-exercises-confirm").click();

    expect(
      await page.evaluate(() =>
        JSON.parse(
          window.localStorage.getItem("TrainingCenterStorage") ?? "[]",
        ),
      ),
    ).toEqual(["AF_free-simulator", "AAAother-topic"]);
  });

  test("opens a curated expression exercise in the matching simulator mode", async ({
    page,
  }) => {
    await gotoDnfPage(page);
    await switchTab(page, "exercises");

    await page
      .getByTestId(`dnf-exercise-card-${SIMPLE_EXPRESSION_EXERCISE_ID}-select`)
      .click();
    await page
      .getByTestId(`dnf-exercise-card-${SIMPLE_EXPRESSION_EXERCISE_ID}-open`)
      .click();

    await expect(
      page.getByTestId("simulation-selected-exercise"),
    ).toHaveAttribute("data-item-id", SIMPLE_EXPRESSION_EXERCISE_ID);
    await expect(page.getByTestId("dnf-simulator")).toHaveAttribute(
      "data-mode",
      "expression_to_truth_table",
    );
    await expect(page.getByTestId("dnf-exercise-truth-table")).toBeVisible();
    await expect(page.getByTestId("dnf-result-button-0-0")).toBeVisible();
  });

  test("solves a truth-table exercise and checks simplification walkthrough reveals", async ({
    page,
  }) => {
    await gotoDnfPage(page);
    await openFirstDnfExercise(page);

    await expect(page.getByTestId("dnf-exercise-truth-table")).toBeVisible();
    await expect(
      page.getByTestId("dnf-follow-up-simplification-toggle"),
    ).toBeDisabled();

    await page
      .getByTestId("dnf-exercise-answer")
      .fill("(!a & !b & c) | (!a & b & c) | (a & !b & !c) | (a & b & !c)");
    await page.getByTestId("dnf-check-answer").click();

    await expect(page.getByTestId("dnf-exercise-feedback")).toHaveAttribute(
      "data-status",
      "correct",
    );

    await page.getByTestId("dnf-follow-up-simplification-toggle").click();
    await expect(page.getByTestId("dnf-simplification-panel")).toBeVisible();
    await expect(
      page.getByTestId("dnf-toggle-simplification-solution"),
    ).toBeDisabled();

    await page.getByTestId("dnf-simplified-answer").fill("(!a & c) | (a & !c)");
    await page.getByTestId("dnf-check-simplification").click();

    await expect(
      page.getByTestId("dnf-simplification-feedback"),
    ).toHaveAttribute("data-status", "accepted_minimal");

    await page.getByTestId("dnf-toggle-simplification-solution").click();
    await expect(
      page.getByTestId("dnf-toggle-simplification-solution"),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("dnf-simplification-solution")).toBeVisible();

    await expect(
      page.getByTestId("dnf-simplification-walkthrough"),
    ).toHaveAttribute("data-view", "compact");
    await expect(page.getByTestId("dnf-walkthrough-group-0")).toBeVisible();
    await expect(
      page.getByTestId("dnf-derivation-step-distributivity").first(),
    ).toBeVisible();
    await expect(
      page.getByTestId("dnf-derivation-step-complement").first(),
    ).toBeVisible();
    await expect(
      page.getByTestId("dnf-derivation-step-identity").first(),
    ).toBeVisible();

    await expect(page.getByTestId("dnf-walkthrough-view-toggle")).toHaveCount(
      0,
    );

    await page.getByTestId("dnf-reveal-algebra-reference").click();
    await expect(
      page.getByTestId("dnf-algebra-rule-distributivity"),
    ).toBeVisible();
    await expect(page.getByTestId("dnf-algebra-rule-de_morgan")).toBeVisible();
  });
});

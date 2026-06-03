import { expect, test, type Page } from "@playwright/test";

const DNF_ROUTE = "/fundamentals-cs/dnf";
const FIRST_DNF_EXERCISE_ID = "dnf.exercises.worksheet02bTruthTable1.title";
const LECTURE_EXPRESSION_EXAMPLE_ID = "lecture-expression";

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

    await switchTab(page, "examples");
    await expect(page.getByTestId("dnf-examples-tab")).toBeVisible();
    await expect(
      page.getByTestId("dnf-example-group-expression_to_truth_table"),
    ).toBeVisible();
    await expect(
      page.getByTestId("dnf-example-group-truth_table_to_dnf"),
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
    await expect(page.getByTestId("dnf-exercise-workspace")).toBeVisible();
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
    await page.getByTestId("dnf-toggle-solution").click();
    await expect(page.getByTestId("dnf-result-panel")).toBeVisible();

    await page.getByTestId("dnf-follow-up-truthTable-toggle").click();
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
      page.getByTestId("dnf-reveal-minimal-solution"),
    ).toBeDisabled();
    await expect(page.getByTestId("dnf-reveal-walkthrough")).toBeDisabled();

    await page.getByTestId("dnf-simplified-answer").fill("(!a & c) | (a & !c)");
    await page.getByTestId("dnf-check-simplification").click();

    await expect(
      page.getByTestId("dnf-simplification-feedback"),
    ).toHaveAttribute("data-status", "accepted_minimal");

    await page.getByTestId("dnf-reveal-minimal-solution").click();
    await expect(
      page.getByTestId("dnf-reveal-minimal-solution"),
    ).toHaveAttribute("aria-expanded", "true");

    await page.getByTestId("dnf-reveal-walkthrough").click();
    await expect(page.getByTestId("dnf-reveal-walkthrough")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

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

    await page.getByTestId("dnf-walkthrough-view-toggle").click();
    await expect(
      page.getByTestId("dnf-simplification-walkthrough"),
    ).toHaveAttribute("data-view", "full");

    await page.getByTestId("dnf-reveal-algebra-reference").click();
    await expect(
      page.getByTestId("dnf-algebra-rule-distributivity"),
    ).toBeVisible();
    await expect(page.getByTestId("dnf-algebra-rule-de_morgan")).toBeVisible();
  });
});

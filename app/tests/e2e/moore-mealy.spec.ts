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
    .getByTestId("moore-mealy-example-moore.examples.mooreDefault-select")
    .click();
  await page
    .getByTestId("moore-mealy-example-moore.examples.mooreDefault-open")
    .click();
  await expect(page.getByTestId("moore-config-view")).toBeVisible();
}

test.describe("Moore and Mealy simulation tab", () => {
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
    await page.getByRole("option", { name: "Binary" }).click();
    await expect(page.getByTestId("moore-state-set")).toContainText(
      "CLOSED_NEW100",
    );

    await page
      .getByTestId("moore-input-alphabet")
      .getByRole("button", { name: /0/ })
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
    await openMooreSimulator(page);

    await page.getByTestId("moore-machine-tab-mealy").click();
    await expect(page.getByTestId("mealy-config-view")).toBeVisible();

    await page.getByTestId("moore-machine-tab-moore").click();
    await expect(page.getByTestId("moore-config-view")).toBeVisible();
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

    await page
      .getByTestId("moore-mealy-example-moore.examples.mooreDefault-select")
      .click();
    await page
      .getByTestId("moore-mealy-example-moore.examples.mooreDefault-open")
      .click();
    await expect(
      page
        .getByTestId("moore-config-view")
        .locator('[data-testid^="moore-state-name-"]'),
    ).toHaveCount(4);

    await page.getByTestId("tab-button-examples").click();
    await page
      .getByTestId("moore-mealy-example-moore.examples.mealyDefault-select")
      .click();
    await page
      .getByTestId("moore-mealy-example-moore.examples.mealyDefault-open")
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
      .getByTestId("moore-mealy-example-moore.examples.mealyDefault-select")
      .click();
    await page
      .getByTestId("moore-mealy-example-moore.examples.mealyDefault-open")
      .click();

    const mealyState = page
      .getByTestId("mealy-config-view")
      .getByTestId("moore-state-name-0");
    await mealyState.fill("CHANGED");
    await mealyState.press("Enter");
    await page.getByTestId("simulation-reset").click();
    await expect(mealyState).toHaveValue("S0");
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
    await expect(page.getByText("y0 =").first()).toHaveCount(0);

    await page.getByTestId("moore-conversion-tab-output").click();
    await expect(page.getByTestId("moore-output-value-table")).toBeVisible();
    await expect(page.getByText("y0 =").first()).toBeVisible();

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

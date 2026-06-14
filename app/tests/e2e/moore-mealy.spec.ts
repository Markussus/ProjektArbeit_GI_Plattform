import { expect, test, type Page } from "@playwright/test";

const ROUTE = "/fundamentals-cs/moore-mealy";

async function openMooreSimulator(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem("i18nextLng", "en");
  });
  await page.goto(ROUTE);
  await page.getByTestId("tab-button-simulation").click();
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
      page.locator('[data-testid^="moore-state-name-"]'),
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
    await openMooreSimulator(page);

    await page.getByTestId("moore-state-name-0").fill("CLOSED");
    await page.getByTestId("moore-state-name-0").press("Enter");
    await page.getByTestId("tab-button-overview").click();

    await expect(page.getByTestId("module-tab-exit-confirm")).toHaveCount(0);

    await page.getByTestId("tab-button-simulation").click();
    await expect(page.getByTestId("moore-state-name-0")).toHaveValue("CLOSED");
  });

  test("shows separate Moore and Mealy sub-tabs without losing the Moore editor", async ({
    page,
  }) => {
    await openMooreSimulator(page);

    await page.getByTestId("moore-machine-tab-mealy").click();
    await expect(page.getByTestId("mealy-simulator-placeholder")).toBeVisible();

    await page.getByTestId("moore-machine-tab-moore").click();
    await expect(page.getByTestId("moore-config-view")).toBeVisible();
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

    await page.getByTestId("moore-subview-back").click();
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

    await page.getByTestId("moore-edit-configuration").click();
    await expect(page.getByTestId("moore-config-view")).toBeVisible();
  });
});

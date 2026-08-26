import { expect, test } from "@playwright/test";
import {
  appTestIds,
  exportActiveSimulator,
  importFromHeader,
} from "../../support/app-shell";

test.describe("Encoding page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fundamentals-cs/encoding");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("switches between overview, exercises, examples, and simulation tabs", async ({
    page,
  }) => {
    await test.step("The overview tab is visible on initial load", async () => {
      await expect(page.getByTestId(appTestIds.tabOverview)).toBeVisible();
      await expect(page.getByTestId(appTestIds.tabExercises)).toBeVisible();
      await expect(page.getByTestId(appTestIds.tabExamples)).toBeVisible();
      await expect(page.getByTestId(appTestIds.tabSimulation)).toBeVisible();
    });

    await test.step("The exercises tab exposes generated exercises", async () => {
      await page.getByTestId(appTestIds.tabExercises).click();
      // We know there are generated exercises. We just check if at least one exercise card exists.
      await expect(page.locator('button[data-testid$="-select"]')).toHaveCount(
        14,
      );
    });

    await test.step("The examples tab shows predefined examples", async () => {
      await page.getByTestId(appTestIds.tabExamples).click();
      await expect(
        page.getByTestId("example-card-encoding.example_base64_2-select"),
      ).toBeVisible();
    });

    await test.step("Opening the simulation tab shows the base64 simulator by default", async () => {
      await page.getByTestId(appTestIds.tabSimulation).click();
      await expect(page.getByTestId("encoding-simulator")).toBeVisible();
      await expect(
        page.getByTestId(appTestIds.simulationSelectedExercise),
      ).toHaveCount(0);
      await expect(page.getByTestId("encoding-tab-base64")).toBeVisible();
      await expect(page.getByTestId("encoding-tab-utf8")).toBeVisible();
      await expect(page.getByTestId("base64-input")).toBeVisible();
    });
  });

  test("base64 simulator can encode and decode", async ({ page }) => {
    await page.getByTestId(appTestIds.tabSimulation).click();
    await expect(page.getByTestId("encoding-simulator")).toBeVisible();
    await page.getByTestId("encoding-tab-base64").click();

    await test.step("Encode mode works correctly", async () => {
      // Input 'Hello'
      await page.getByTestId("base64-input").fill("Hello");
      await expect(page.getByTestId("base64-result")).toContainText("SGVsbG8=");
    });

    await test.step("Switching to decode mode works", async () => {
      // Toggle to decode
      await page.getByTestId("mode-toggle-decode").click();
      // Input 'SGVsbG8='
      await page.getByTestId("base64-input").fill("SGVsbG8=");
      await expect(page.getByTestId("base64-result")).toContainText("Hello");
    });
  });

  test("utf8 simulator can encode and decode", async ({ page }) => {
    await page.getByTestId(appTestIds.tabSimulation).click();
    await expect(page.getByTestId("encoding-simulator")).toBeVisible();
    await page.getByTestId("encoding-tab-utf8").click();

    await test.step("Encode mode works correctly", async () => {
      // Toggle to encode
      await page.getByTestId("mode-toggle-encode").click();
      // Input 'A'
      await page.getByTestId("utf8-input").fill("A");
      await expect(page.getByTestId("utf8-result-hex")).toContainText("41");
    });

    await test.step("Switching to decode mode works", async () => {
      // Toggle to decode
      await page.getByTestId("mode-toggle-decode").click();
      // Input hex '41'
      await page.getByTestId("utf8-input").fill("41");
      await expect(page.getByTestId("utf8-result-ascii")).toContainText("A");
    });
  });

  test("lets users select an exercise and open it in simulation", async ({
    page,
  }) => {
    await page.getByTestId(appTestIds.tabExercises).click();

    await test.step("Selecting an exercise should expand its details", async () => {
      const firstExercise = page
        .locator('button[data-testid$="-select"]')
        .first();
      const testId = await firstExercise.getAttribute("data-testid");
      if (testId) {
        await firstExercise.click();
        const openTestId = testId.replace("-select", "-open");
        await expect(page.getByTestId(openTestId).first()).toBeVisible();

        await test.step("Opening an exercise in simulation should preserve the exercise context", async () => {
          await page.getByTestId(openTestId).first().click();
          await expect(page.getByTestId("encoding-simulator")).toBeVisible();
          await expect(
            page.getByTestId(appTestIds.simulationSelectedExercise),
          ).toBeVisible();
        });
      }
    });
  });

  test("example opens in simulation with pre-filled values", async ({
    page,
  }) => {
    await page.getByTestId(appTestIds.tabExamples).click();

    await test.step("Select and open example", async () => {
      await page
        .getByTestId("example-card-encoding.example_base64_2-select")
        .click();
      await expect(
        page.getByTestId("example-card-encoding.example_base64_2-open"),
      ).toBeVisible();
      await page
        .getByTestId("example-card-encoding.example_base64_2-open")
        .click();
    });

    await test.step("Simulator shows pre-filled text THWS", async () => {
      await expect(page.getByTestId("encoding-simulator")).toBeVisible();
      await expect(page.getByTestId("base64-input")).toHaveValue("THWS");
      await expect(page.getByTestId("base64-result")).toContainText("VEhXUw==");
    });
  });

  test("global transfer allows import and correctly updates UI", async ({
    page,
  }) => {
    await page.getByTestId(appTestIds.tabSimulation).click();
    await expect(page.getByTestId("encoding-simulator")).toBeVisible();

    await expect(
      page.getByTestId(appTestIds.headerTransferExport),
    ).toBeEnabled();
    await expect(
      page.locator('[data-testid^="encoding-transfer-"]'),
    ).toHaveCount(0);

    // 1. Switch to UTF-8 tab and decode mode
    await page.getByTestId("encoding-tab-utf8").click();
    await page.getByTestId("mode-toggle-decode").click();
    await page.getByTestId("utf8-input").fill("41");
    await expect(page.getByTestId("utf8-result-ascii")).toContainText("A");

    // 2. Export the current state through the header clipboard action
    const exportedString = await exportActiveSimulator(page);
    expect(exportedString).toMatch(/^[A-Za-z0-9_-]{3}[A-Za-z0-9_-]+$/);

    // 3. Switch back to Base64 to mess up the state
    await page.getByTestId("encoding-tab-base64").click();
    await expect(page.getByTestId("base64-input")).toBeVisible();

    // 4. Import the exported state through the global header
    await importFromHeader(page, exportedString);

    // 5. Verify the UI switched to utf8 tab and decode mode
    await expect(page.getByTestId("encoding-tab-utf8")).toHaveClass(
      /text-tab-active/,
    );
    await expect(page.getByTestId("utf8-input")).toHaveValue("41");
    await expect(page.getByTestId("utf8-result-ascii")).toContainText("A");
  });
});

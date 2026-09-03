import { expect, test } from "@playwright/test";

const RL_URL = "/fundamentals-cs/regular-languages";
// Free mode opens blank; the worked grammars live in the Examples tab.
const BLANK_GRAMMAR = "";

test.describe("Regular Languages — Overview tab", () => {
  test("shows only the tutorial video", async ({ page }) => {
    await page.goto(RL_URL);
    await expect(page.getByTestId("rl-tutorial-video")).toBeVisible();
  });
});

test.describe("Regular Languages — reset", () => {
  test("deletes only the active mode draft and restores its blank starter", async ({
    page,
  }) => {
    await page.goto(RL_URL);
    await page.evaluate(() => localStorage.clear());
    await page.getByTestId("tab-button-simulation").click();

    const source = page.getByTestId("rl-grammar-to-language-source");
    await source.fill("S -> xS | x");
    await page.getByTestId("header-transfer-export").click();
    const storageValue = await page
      .getByTestId("header-transfer-input")
      .inputValue();
    // Global export and auto-save share this identifier + payload format.
    await page.evaluate((value) => {
      localStorage.setItem("TrainingCenterStorage", JSON.stringify([value]));
    }, storageValue);
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("TrainingCenterStorage")),
      )
      .not.toBeNull();

    await page.getByTestId("simulation-reset").click();
    await expect(page.getByTestId("rl-grammar-to-language-source")).toHaveValue(
      BLANK_GRAMMAR,
    );
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("TrainingCenterStorage")),
      )
      .toBeNull();

    await page.getByTestId("tab-button-overview").click();
    await page.getByTestId("tab-button-simulation").click();
    await expect(page.getByTestId("rl-grammar-to-language-source")).toHaveValue(
      BLANK_GRAMMAR,
    );
  });
});

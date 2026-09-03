import { expect, test, type Page } from "@playwright/test";

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

/**
 * Per-exercise Training Center persistence, matching what the Turing Machine
 * and Moore/Mealy specs assert for their topics. Exercise slots are numbered
 * from 0 ("ACA", "ACB", …); the free simulator's three modes sit at the top of
 * the range ("AC_", "AC-", "AC9").
 */
const G2L_FINITE_BINARY = "regular-languages.exercises.g2lFiniteBinary.title";
const G2L_TRAILING_ZERO = "regular-languages.exercises.g2lTrailingZero.title";

async function openRLExercise(page: Page, titleKey: string) {
  await page.getByTestId("tab-button-exercises").click();
  await page.getByTestId(`exercise-card-${titleKey}`).click();
  await page.getByTestId(`exercise-card-${titleKey}-open`).click();
  await expect(page.getByTestId("rl-g2l-enumeration-input")).toBeVisible();
}

test.describe("Regular Languages — exercise persistence", () => {
  test("restores an exercise answer and keeps it out of other slots", async ({
    page,
  }) => {
    await page.goto(RL_URL);
    await page.evaluate(() => localStorage.clear());

    await openRLExercise(page, G2L_FINITE_BINARY);
    await page.getByTestId("rl-g2l-enumeration-input").fill("100, 101, 110");

    // Autosave flushes when the simulator unmounts, which leaving the tab does.
    await page.getByTestId("tab-button-overview").click();
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("TrainingCenterStorage")),
      )
      .not.toBeNull();

    await openRLExercise(page, G2L_FINITE_BINARY);
    await expect(page.getByTestId("rl-g2l-enumeration-input")).toHaveValue(
      "100, 101, 110",
    );

    await page.getByTestId("tab-button-overview").click();
    await openRLExercise(page, G2L_TRAILING_ZERO);
    await expect(page.getByTestId("rl-g2l-enumeration-input")).toHaveValue("");
  });

  test("resets all RL exercises while preserving the free simulator modes", async ({
    page,
  }) => {
    await page.goto(RL_URL);
    await page.evaluate(() => {
      localStorage.setItem(
        "TrainingCenterStorage",
        JSON.stringify([
          "ACAexercise-0",
          "ACBexercise-1",
          "AC_grammar-to-language",
          "AC-language-to-grammar",
          "AC9recognize-word",
        ]),
      );
    });

    await page.getByTestId("tab-button-exercises").click();
    await page.getByTestId("rl-reset-all-exercises").click();
    await page.getByTestId("rl-reset-all-exercises-confirm").click();

    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("TrainingCenterStorage") ?? "[]"),
      ),
    ).toEqual([
      "AC_grammar-to-language",
      "AC-language-to-grammar",
      "AC9recognize-word",
    ]);
  });
});

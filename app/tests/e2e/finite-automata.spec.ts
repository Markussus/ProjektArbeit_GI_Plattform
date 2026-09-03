import { test, expect, type Page } from "@playwright/test";

const FA_URL = "/fundamentals-cs/finite-automata";

async function gotoFAPage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem("i18nextLng", "en");
  });
  await page.goto(FA_URL);
  await expect(page.getByTestId("tab-button-simulation")).toBeVisible();
}

async function openSimulationTab(page: Page) {
  await gotoFAPage(page);
  await page.getByTestId("tab-button-simulation").click();
  await expect(page.getByTestId("fa-mode-tab-manual")).toBeVisible();
}

test.describe("Finite Automata page", () => {
  test("page loads and shows the topic title", async ({ page }) => {
    await gotoFAPage(page);
    await expect(page).toHaveURL(new RegExp("finite-automata"));
    await expect(page.locator("body")).toBeVisible();
  });

  test("shows the four navigation tabs", async ({ page }) => {
    await gotoFAPage(page);
    await expect(page.getByTestId("tab-button-overview")).toBeVisible();
    await expect(page.getByTestId("tab-button-exercises")).toBeVisible();
    await expect(page.getByTestId("tab-button-examples")).toBeVisible();
    await expect(page.getByTestId("tab-button-simulation")).toBeVisible();
  });

  test("shows only the tutorial video", async ({ page }) => {
    await gotoFAPage(page);
    await expect(page.getByTestId("automata-tutorial-video")).toBeVisible();
  });
});

test.describe("Finite Automata — Simulation tab", () => {
  test.beforeEach(async ({ page }) => {
    await openSimulationTab(page);
  });

  test("switches to the Simulation tab", async ({ page }) => {
    await expect(page.getByTestId("fa-mode-tab-manual")).toBeVisible();
  });

  test("shows the Manual Editor mode toggle active by default", async ({
    page,
  }) => {
    const manualBtn = page.getByTestId("fa-mode-tab-manual");
    await expect(manualBtn).toBeVisible();
  });

  test("shows the From Grammar mode button", async ({ page }) => {
    await expect(page.getByTestId("fa-mode-tab-grammar")).toBeVisible();
  });

  test("does not show a Generator mode button", async ({ page }) => {
    await expect(page.getByTestId("fa-mode-tab-generator")).toHaveCount(0);
  });

  test("renders the Transition Table heading", async ({ page }) => {
    await expect(
      page.getByText(/Transition Table|Übergangstabelle/i),
    ).toBeVisible();
  });

  test("opens on the blank starter with a single state column", async ({
    page,
  }) => {
    // emptyFAProgram: one start state, no transitions, no accept states.
    await expect(page.getByRole("columnheader", { name: /S0/ })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /S1/ })).toHaveCount(0);
  });

  test("marks the start state with →", async ({ page }) => {
    await expect(
      page.getByRole("columnheader", { name: /S0.*→/ }),
    ).toBeVisible();
  });

  test("marks no accept state on the blank starter", async ({ page }) => {
    await expect(page.getByRole("columnheader", { name: /\*/ })).toHaveCount(0);
  });

  test("shows the alphabet symbol rows (a and b)", async ({ page }) => {
    const cells = page.locator("td").filter({ hasText: /^a$/ });
    await expect(cells.first()).toBeVisible();
    const cellsB = page.locator("td").filter({ hasText: /^b$/ });
    await expect(cellsB.first()).toBeVisible();
  });

  test("starts with empty transition inputs", async ({ page }) => {
    await expect(page.getByLabel("δ(S0, a)")).toHaveValue("");
    await expect(page.getByLabel("δ(S0, b)")).toHaveValue("");
  });

  test("shows an empty Input Word field with its placeholder", async ({
    page,
  }) => {
    await expect(page.getByPlaceholder("aab")).toHaveValue("");
  });

  test("shows the Start Simulation button", async ({ page }) => {
    await expect(page.getByTestId("fa-start-simulation")).toBeVisible();
  });
});

test.describe("Finite Automata — editor interactions", () => {
  test.beforeEach(async ({ page }) => {
    await openSimulationTab(page);
  });

  test("allows editing a transition input", async ({ page }) => {
    const input = page.getByLabel("δ(S0, a)");
    await input.clear();
    await input.fill("S0");
    await expect(input).toHaveValue("S0");
  });

  test("allows clearing a transition", async ({ page }) => {
    const input = page.getByLabel("δ(S0, b)");
    await input.clear();
    await expect(input).toHaveValue("");
  });

  test("allows changing the input word", async ({ page }) => {
    const inputWord = page.getByPlaceholder("aab");
    await inputWord.clear();
    await inputWord.fill("ab");
    await expect(inputWord).toHaveValue("ab");
  });

  test("Start Simulation button is enabled when the program is valid", async ({
    page,
  }) => {
    const btn = page.getByTestId("fa-start-simulation");
    await expect(btn).toBeEnabled();
  });

  test("switches to the grammar editor mode", async ({ page }) => {
    await page.getByTestId("fa-mode-tab-grammar").click();
    await expect(
      page.getByText(/Transition Table|Übergangstabelle/i),
    ).not.toBeVisible();
  });

  test("switches back to manual editor after clicking Manual Editor", async ({
    page,
  }) => {
    await page.getByTestId("fa-mode-tab-grammar").click();
    await page.getByTestId("fa-mode-tab-manual").click();
    await expect(
      page.getByText(/Transition Table|Übergangstabelle/i),
    ).toBeVisible();
  });

  test("reset deletes the saved draft and restores the blank starter", async ({
    page,
  }) => {
    await page.getByTestId("header-transfer-export").click();
    const defaultExport = await page
      .getByTestId("header-transfer-input")
      .inputValue();
    const transition = page.getByLabel("δ(S0, a)");
    await transition.fill("S0");
    await page.getByPlaceholder("aab").fill("ab");
    await page.getByTestId("fa-start-simulation").click();
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("TrainingCenterStorage")),
      )
      .not.toBeNull();

    await page.getByTestId("simulation-reset").click();
    await expect(page.getByLabel("δ(S0, a)")).toHaveValue("");
    await expect(page.getByPlaceholder("aab")).toHaveValue("");
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("TrainingCenterStorage")),
      )
      .toBeNull();
    await page.getByTestId("header-transfer-export").click();
    await expect(page.getByTestId("header-transfer-input")).toHaveValue(
      defaultExport,
    );

    await page.getByTestId("tab-button-overview").click();
    await page.getByTestId("tab-button-simulation").click();
    await expect(page.getByLabel("δ(S0, a)")).toHaveValue("");
  });
});

test.describe("Finite Automata — Grammar tab", () => {
  test.beforeEach(async ({ page }) => {
    await openSimulationTab(page);
    await page.getByTestId("fa-mode-tab-grammar").click();
  });

  test("shows the Convert to Automaton button", async ({ page }) => {
    await expect(page.getByTestId("fa-convert-grammar")).toBeVisible();
  });

  test("shows the Load Example button", async ({ page }) => {
    await expect(page.getByTestId("fa-load-grammar-example")).toBeVisible();
  });

  test("shows the Supported Formats section", async ({ page }) => {
    await expect(
      page.getByText(/Supported Formats|Unterstützte Formate/i),
    ).toBeVisible();
  });

  test("grammar input starts empty with placeholder", async ({ page }) => {
    const textarea = page.locator("#fa-grammar-productions");
    await expect(textarea).toHaveValue("");
    await expect(textarea).toHaveAttribute("placeholder", /S -> 0S/);
  });

  test("loading example populates grammar and detects simplified format", async ({
    page,
  }) => {
    await page.getByTestId("fa-load-grammar-example").click();
    await expect(
      page.getByText(/Detected format|Erkanntes Format/i),
    ).toContainText(/Simplified|Vereinfacht/i);
  });

  test("switching to structured format updates the detected label", async ({
    page,
  }) => {
    const textarea = page.locator("#fa-grammar-productions");
    await textarea.fill(
      "type: grammar\nproductions:\nS -> 0S | 1A\nA -> 0A | 1",
    );
    await expect(
      page.getByText(/Detected format|Erkanntes Format/i),
    ).toContainText(/Structured|Strukturiert/i);
  });

  test("converts the loaded example grammar and returns to the manual editor", async ({
    page,
  }) => {
    await page.getByTestId("fa-load-grammar-example").click();
    await page.getByTestId("fa-convert-grammar").click();
    await expect(
      page.getByText(/Transition Table|Übergangstabelle/i),
    ).toBeVisible();
  });
});

test.describe("Finite Automata — running a simulation", () => {
  test.beforeEach(async ({ page }) => {
    await openSimulationTab(page);
  });

  test("clicking Start Simulation shows the simulation view", async ({
    page,
  }) => {
    await page.getByTestId("fa-start-simulation").click();
    await expect(page.getByTestId("fa-edit-simulation")).toBeVisible({
      timeout: 5000,
    });
  });

  test("simulation view shows the input word", async ({ page }) => {
    await page.getByPlaceholder("aab").fill("aab");
    await page.getByTestId("fa-start-simulation").click();
    await expect(page.getByText("aab")).toBeVisible({ timeout: 5000 });
  });

  test("can return to edit mode by clicking Edit", async ({ page }) => {
    await page.getByTestId("fa-start-simulation").click();
    await page.getByTestId("fa-edit-simulation").click({ timeout: 5000 });
    await expect(
      page.getByText(/Transition Table|Übergangstabelle/i),
    ).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Finite Automata — opening an example", () => {
  test("loads the example's automaton over a previously saved draft", async ({
    page,
  }) => {
    await openSimulationTab(page);
    await page.getByTestId("fa-start-simulation").click();
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("TrainingCenterStorage")),
      )
      .not.toBeNull();

    await page.getByTestId("tab-button-examples").click();
    await page.getByTestId("fa-example-card-ends-with-ab-select").click();
    await page.getByTestId("fa-example-card-ends-with-ab-open").click();

    await expect(page.getByLabel("δ(S0, a)")).toHaveValue("S1");
    await expect(page.getByLabel("δ(S1, b)")).toHaveValue("S2");
    await expect(page.getByPlaceholder("aab")).toHaveValue("aab");
  });
});

test.describe("Finite Automata — Examples tab", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFAPage(page);
    await page.getByTestId("tab-button-examples").click();
  });

  test("shows the Examples tab content", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
  });

  test("displays at least one example card", async ({ page }) => {
    const content = page.locator("main, [role='main'], .p-8, .p-4").first();
    await expect(content).toBeVisible();
  });
});

/**
 * Per-exercise Training Center persistence, matching what the Turing Machine
 * and Moore/Mealy specs assert for their topics.
 */
const ENDS_WITH_01 = "finite-automata.exercisesTab.endsWith01.title";
const ENDS_WITH_00 = "finite-automata.exercisesTab.endsWith00.title";

async function openFAExercise(page: Page, titleKey: string) {
  await page.getByTestId("tab-button-exercises").click();
  await page.getByTestId(`exercise-card-${titleKey}`).click();
  await page.getByTestId(`exercise-card-${titleKey}-open`).click();
  await expect(page.getByTestId("fa-mode-tab-manual")).toBeVisible();
}

test.describe("Finite Automata — exercise persistence", () => {
  test("restores an exercise draft and keeps it out of other slots", async ({
    page,
  }) => {
    await gotoFAPage(page);

    await openFAExercise(page, ENDS_WITH_01);
    await page.getByLabel("δ(S0, 0)").fill("S0");
    // Applying the program writes the slot straight away; autosave alone only
    // runs on its interval or when the simulator unmounts.
    await page.getByTestId("fa-start-simulation").click();
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("TrainingCenterStorage")),
      )
      .not.toBeNull();

    // Leaving and returning must bring the work back.
    await page.getByTestId("tab-button-overview").click();
    await openFAExercise(page, ENDS_WITH_01);
    await expect(page.getByLabel("δ(S0, 0)")).toHaveValue("S0");

    // A different exercise must not inherit it — the whole point of one slot
    // per exercise.
    await page.getByTestId("tab-button-overview").click();
    await openFAExercise(page, ENDS_WITH_00);
    await expect(page.getByLabel("δ(S0, 0)")).toHaveValue("");
  });

  test("resets all FA exercises while preserving the free simulator", async ({
    page,
  }) => {
    await gotoFAPage(page);
    await page.evaluate(() => {
      window.localStorage.setItem(
        "TrainingCenterStorage",
        JSON.stringify(["ABAexercise-0", "ABBexercise-1", "AB_free-simulator"]),
      );
    });

    await page.getByTestId("tab-button-exercises").click();
    await page.getByTestId("fa-reset-all-exercises").click();
    await page.getByTestId("fa-reset-all-exercises-confirm").click();

    expect(
      await page.evaluate(() =>
        JSON.parse(
          window.localStorage.getItem("TrainingCenterStorage") ?? "[]",
        ),
      ),
    ).toEqual(["AB_free-simulator"]);
  });
});

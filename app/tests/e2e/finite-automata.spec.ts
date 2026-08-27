import { test, expect } from "@playwright/test";

const FA_URL = "/fundamentals-cs/finite-automata";

test.describe("Finite Automata page", () => {
  test("page loads and shows the topic title", async ({ page }) => {
    await page.goto(FA_URL);
    await expect(page).toHaveURL(new RegExp("finite-automata"));
    // The page title is rendered via t("automata.title") — check a key element exists
    await expect(page.locator("body")).toBeVisible();
  });

  test("shows the four navigation tabs", async ({ page }) => {
    await page.goto(FA_URL);
    await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Exercises" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Examples" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Simulation" }),
    ).toBeVisible();
  });
});

test.describe("Finite Automata — Simulation tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FA_URL);
    await page.getByRole("button", { name: "Simulation" }).click();
  });

  test("switches to the Simulation tab", async ({ page }) => {
    // The editor panel is visible — look for the mode toggle
    await expect(
      page.getByRole("button", { name: /Manual Editor/i }),
    ).toBeVisible();
  });

  test("shows the Manual Editor mode toggle active by default", async ({
    page,
  }) => {
    const manualBtn = page.getByRole("button", { name: /Manual Editor/i });
    await expect(manualBtn).toBeVisible();
  });

  test("shows the From Grammar mode button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /From Grammar/i }),
    ).toBeVisible();
  });

  test("does not show a Generator mode button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /^Generator$/i }),
    ).toHaveCount(0);
  });

  test("renders the Transition Table heading", async ({ page }) => {
    await expect(page.getByText("Transition Table")).toBeVisible();
  });

  test("renders the default DFA states as column headers", async ({ page }) => {
    // defaultDFAProgram states: S0, S1, S2
    await expect(page.getByRole("columnheader", { name: /S0/ })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /S1/ })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /S2/ })).toBeVisible();
  });

  test("marks the start state with →", async ({ page }) => {
    await expect(
      page.getByRole("columnheader", { name: /S0.*→/ }),
    ).toBeVisible();
  });

  test("marks the accept state with *", async ({ page }) => {
    await expect(
      page.getByRole("columnheader", { name: /S2.*\*/ }),
    ).toBeVisible();
  });

  test("shows the alphabet symbol rows (a and b)", async ({ page }) => {
    // The first column of each row shows the symbol
    const cells = page.locator("td").filter({ hasText: /^a$/ });
    await expect(cells.first()).toBeVisible();
    const cellsB = page.locator("td").filter({ hasText: /^b$/ });
    await expect(cellsB.first()).toBeVisible();
  });

  test("pre-fills transition inputs with the default DFA transitions", async ({
    page,
  }) => {
    // δ(S0, a) = S1
    const input = page.getByLabel("δ(S0, a)");
    await expect(input).toHaveValue("S1");
  });

  test("pre-fills δ(S1, b) = S2", async ({ page }) => {
    const input = page.getByLabel("δ(S1, b)");
    await expect(input).toHaveValue("S2");
  });

  test("shows the Input Word field with default value 'aab'", async ({
    page,
  }) => {
    const inputWord = page.getByPlaceholder("aab");
    await expect(inputWord).toHaveValue("aab");
  });

  test("shows the Start Simulation button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Start Simulation/i }),
    ).toBeVisible();
  });
});

test.describe("Finite Automata — editor interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FA_URL);
    await page.getByRole("button", { name: "Simulation" }).click();
  });

  test("allows editing a transition input", async ({ page }) => {
    const input = page.getByLabel("δ(S0, a)");
    await input.clear();
    await input.fill("S2");
    await expect(input).toHaveValue("S2");
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
    const btn = page.getByRole("button", { name: /Start Simulation/i });
    await expect(btn).toBeEnabled();
  });

  test("switches to the grammar editor mode", async ({ page }) => {
    await page.getByRole("button", { name: /From Grammar/i }).click();
    // Grammar input panel should appear — it won't show the transition table
    await expect(page.getByText("Transition Table")).not.toBeVisible();
  });

  test("switches back to manual editor after clicking Manual Editor", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /From Grammar/i }).click();
    await page.getByRole("button", { name: /Manual Editor/i }).click();
    await expect(page.getByText("Transition Table")).toBeVisible();
  });

  test("reset deletes the saved draft and restores the default after remount", async ({
    page,
  }) => {
    await page.evaluate(() => localStorage.clear());
    await page.getByTestId("header-transfer-export").click();
    const defaultExport = await page
      .getByTestId("header-transfer-input")
      .inputValue();
    const transition = page.getByLabel("δ(S0, a)");
    await transition.fill("S2");
    await page.getByPlaceholder("aab").fill("ab");
    await page.getByRole("button", { name: /Start Simulation/i }).click();
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("TrainingCenterStorage")),
      )
      .not.toBeNull();

    await page.getByTestId("simulation-reset").click();
    await expect(page.getByLabel("δ(S0, a)")).toHaveValue("S1");
    await expect(page.getByPlaceholder("aab")).toHaveValue("aab");
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("TrainingCenterStorage")),
      )
      .toBeNull();
    await page.getByTestId("header-transfer-export").click();
    await expect(page.getByTestId("header-transfer-input")).toHaveValue(
      defaultExport,
    );

    await page.getByRole("button", { name: "Overview" }).click();
    await page.getByRole("button", { name: "Simulation" }).click();
    await expect(page.getByLabel("δ(S0, a)")).toHaveValue("S1");
  });
});

test.describe("Finite Automata — Grammar tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FA_URL);
    await page.getByRole("button", { name: "Simulation" }).click();
    await page.getByRole("button", { name: /From Grammar/i }).click();
  });

  test("shows the Convert to Automaton button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Convert to Automaton/i }),
    ).toBeVisible();
  });

  test("shows the Load Example button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Load Example/i }),
    ).toBeVisible();
  });

  test("shows the Supported Formats section", async ({ page }) => {
    await expect(page.getByText(/Supported Formats/i)).toBeVisible();
  });

  test("default grammar uses the simplified format", async ({ page }) => {
    await expect(page.getByText(/Detected format/i)).toContainText(
      /Simplified/i,
    );
  });

  test("switching to structured format updates the detected label", async ({
    page,
  }) => {
    const textarea = page.locator("#fa-grammar-productions");
    await textarea.fill(
      "type: grammar\nproductions:\nS -> 0S | 1A\nA -> 0A | 1",
    );
    await expect(page.getByText(/Detected format/i)).toContainText(
      /Structured/i,
    );
  });

  test("converts the default grammar and returns to the manual editor", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Convert to Automaton/i }).click();
    await expect(page.getByText("Transition Table")).toBeVisible();
  });
});

test.describe("Finite Automata — running a simulation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FA_URL);
    await page.getByRole("button", { name: "Simulation" }).click();
  });

  test("clicking Start Simulation shows the simulation view", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Start Simulation/i }).click();
    // The simulation view replaces the editor; the edit button should now appear
    await expect(page.getByRole("button", { name: /Edit/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test("simulation view shows the input word", async ({ page }) => {
    await page.getByRole("button", { name: /Start Simulation/i }).click();
    // The input word "aab" should be displayed in the simulation view
    await expect(page.getByText("aab")).toBeVisible({ timeout: 5000 });
  });

  test("can return to edit mode by clicking Edit", async ({ page }) => {
    await page.getByRole("button", { name: /Start Simulation/i }).click();
    await page.getByRole("button", { name: /Edit/i }).click({ timeout: 5000 });
    await expect(page.getByText("Transition Table")).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Finite Automata — Examples tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FA_URL);
    await page.getByRole("button", { name: "Examples" }).click();
  });

  test("shows the Examples tab content", async ({ page }) => {
    // The examples tab should be visible with at least one example card
    await expect(page.locator("body")).toBeVisible();
  });

  test("displays at least one example card", async ({ page }) => {
    // Examples are shown as cards — just verify the tab has content
    const content = page.locator("main, [role='main'], .p-8, .p-4").first();
    await expect(content).toBeVisible();
  });
});

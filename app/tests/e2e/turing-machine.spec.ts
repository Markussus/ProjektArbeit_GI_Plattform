import { expect, test, type Locator, type Page } from "@playwright/test";

const TURING_MACHINE_ROUTE = "/fundamentals-cs/turing-machine";
const DELTA = "\u03b4";
const Q0_SUBSCRIPT = "q\u2080";
const Q1_SUBSCRIPT = "q\u2081";
const Q3_SUBSCRIPT = "q\u2083";
const Q9_SUBSCRIPT = "q\u2089";

async function gotoTuringMachinePage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("i18nextLng", "en");
  });

  await page.goto(TURING_MACHINE_ROUTE);

  await expect(
    page.getByRole("heading", { name: "Turing Machines" }),
  ).toBeVisible();
}

async function openSimulationTab(page: Page) {
  await page.getByRole("button", { name: "Simulation" }).click();

  await expect(
    page.getByRole("heading", { name: "Turing Machine Configuration" }),
  ).toBeVisible();
}

function transitionTable(page: Page): Locator {
  return page.getByRole("table", { name: "Table view" });
}

function getCellInput(page: Page, row: number, column: string): Locator {
  return page.getByRole("textbox", {
    name: `Edit cell in row ${row}, column ${column}`,
  });
}

function getHeaderInput(page: Page, column: number): Locator {
  return page.getByRole("textbox", {
    name: `Edit column ${column} header`,
  });
}

function getStatusCard(page: Page): Locator {
  return page.getByRole("heading", { name: "Status" }).locator("..");
}

function getHaltStatesPanel(page: Page): Locator {
  return page.getByRole("heading", { name: "Halt States" }).locator("../..");
}

test.describe("Turing Machine page", () => {
  // Tests the tab navigation and the static overview/examples content that frames the topic page.
  test("shows the topic overview and switches between the top-level tabs", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);

    await expect(
      page.getByRole("heading", { name: "What is a Turing Machine?" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Examples" }).click();
    await expect(
      page.getByText(
        "Interactive examples for Turing Machines will be available here.",
      ),
    ).toBeVisible();

    await page.getByRole("button", { name: "Overview" }).click();
    await expect(
      page.getByRole("heading", { name: "What is a Turing Machine?" }),
    ).toBeVisible();
  });

  // Tests exercise selection, opening an exercise in the simulator, and the simulation focus toggle workflow.
  test("opens an exercise in the simulation workspace and toggles focus mode", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);

    await page.getByRole("button", { name: "Exercises" }).click();

    const firstExerciseButton = page.getByRole("button", {
      name: /Exercise 1: Basic Transition/i,
    });

    await firstExerciseButton.click();
    await expect(firstExerciseButton).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("button", { name: "Open in simulation" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Open in simulation" }).click();

    await expect(
      page.getByText("Selected exercise", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Basic Transition", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Design a simple TM transition table"),
    ).toBeVisible();

    const focusToggle = page.getByRole("button", {
      name: "Expand simulation",
    });
    await focusToggle.click();
    await expect(
      page.getByRole("button", { name: "Exit simulation focus" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Turing Machines" }),
    ).toBeHidden();

    await page.getByRole("button", { name: "Overview" }).click();
    await expect(
      page.getByRole("heading", { name: "Turing Machines" }),
    ).toBeVisible();
  });

  // Tests the configuration editor controls for tape input, state selection, halt states, row/column management, and protected removal alerts.
  test("edits the machine configuration through the visible editor controls", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);
    await openSimulationTab(page);

    const initialTapeInput = page.getByPlaceholder(
      "Enter input word (e.g., 1011)",
    );

    await initialTapeInput.fill("10102");
    await expect(initialTapeInput).toHaveValue("10102");
    await expect(page.getByText("2", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Start State" }).click();
    await page.getByRole("option", { name: Q1_SUBSCRIPT }).click();
    await expect(
      page.getByRole("button", { name: "Start State" }),
    ).toContainText(Q1_SUBSCRIPT);

    const addHaltStateInput = page.getByRole("textbox", {
      name: "Add Halt State",
    });
    await addHaltStateInput.fill("q9");
    await addHaltStateInput.press("Enter");
    await expect(addHaltStateInput).toHaveValue("");
    await expect(page.getByText(Q9_SUBSCRIPT, { exact: true })).toBeVisible();

    await expect(
      transitionTable(page).getByRole("button", { name: "Remove row 1" }),
    ).toHaveCount(1);
    await expect(
      transitionTable(page).getByRole("button", { name: /Remove row / }),
    ).toHaveCount(3);

    await transitionTable(page)
      .getByRole("button", { name: "Add new row" })
      .click();
    await expect(
      transitionTable(page).getByRole("button", { name: /Remove row / }),
    ).toHaveCount(4);

    await transitionTable(page)
      .getByRole("button", { name: "Add column" })
      .click();
    await expect(getHeaderInput(page, 5)).toHaveValue(Q3_SUBSCRIPT);
    await getHeaderInput(page, 5).fill("qAccept");
    await expect(getHeaderInput(page, 5)).toHaveValue("qAccept");

    await transitionTable(page)
      .getByRole("button", { name: "Remove row 4" })
      .click();
    await expect(
      transitionTable(page).getByRole("button", { name: /Remove row / }),
    ).toHaveCount(3);

    await transitionTable(page)
      .getByRole("button", { name: "Remove column" })
      .last()
      .click();
    await expect(getHeaderInput(page, 5)).toHaveCount(0);

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe("The blank symbol cannot be removed.");
      await dialog.accept();
    });
    await transitionTable(page)
      .getByRole("button", { name: "Remove row 1" })
      .click();

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe("The symbol column cannot be removed.");
      await dialog.accept();
    });
    await transitionTable(page)
      .getByRole("button", { name: "Remove column" })
      .first()
      .click({ force: true });
  });

  // Tests cell-level validation errors, the blocking editor state, and program-level validation before the configuration can be applied.
  test("validates invalid symbol, transition, and program configurations before starting the simulation", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);
    await openSimulationTab(page);

    const startSimulationButton = page.getByRole("button", {
      name: "Start Simulation",
    });

    const tapeSymbolCell = getCellInput(page, 2, DELTA);
    await tapeSymbolCell.fill("ab");
    await tapeSymbolCell.blur();

    await expect(
      page.getByText("Tape symbols must consist of exactly one character.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(startSimulationButton).toBeDisabled();
    await expect(
      page.getByPlaceholder("Enter input word (e.g., 1011)"),
    ).toBeDisabled();

    await tapeSymbolCell.fill("x");
    await tapeSymbolCell.blur();
    await expect(
      page.getByText("Tape symbols must consist of exactly one character."),
    ).toHaveCount(0);
    await expect(startSimulationButton).toBeEnabled();

    const transitionCell = getCellInput(page, 2, Q0_SUBSCRIPT);
    await transitionCell.fill("invalid");
    await transitionCell.blur();

    await expect(
      page.getByText(
        "Transitions must use the format (Next State, Write Symbol, Movement) and the write symbol must be exactly one character.",
      ),
    ).toBeVisible();
    await expect(startSimulationButton).toBeDisabled();

    await transitionCell.fill("(q1, 1, R)");
    await transitionCell.blur();
    await expect(
      page.getByText(
        "Transitions must use the format (Next State, Write Symbol, Movement) and the write symbol must be exactly one character.",
      ),
    ).toHaveCount(0);
    await expect(startSimulationButton).toBeEnabled();

    await getHaltStatesPanel(page).locator("label", { hasText: "qS" }).click();
    await startSimulationButton.click();

    await expect(
      page.getByText("At least one halt state must be defined."),
    ).toBeVisible();

    await getHaltStatesPanel(page).locator("label", { hasText: "qS" }).click();
    await startSimulationButton.click();

    await expect(
      page.getByRole("heading", { name: "Turing Machine Simulator" }),
    ).toBeVisible();
  });

  // Tests the simulator runtime controls in simulation mode, including step, step back, reset, play/pause, speed changes, and returning to edit mode.
  test("runs the simulator controls and reports runtime state changes", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);
    await openSimulationTab(page);

    await page.getByRole("button", { name: "Start Simulation" }).click();

    await expect(
      page.getByRole("heading", { name: "Turing Machine Simulator" }),
    ).toBeVisible();
    await expect(getStatusCard(page)).toContainText("Current State");
    await expect(getStatusCard(page)).toContainText(Q0_SUBSCRIPT);
    await expect(getStatusCard(page)).toContainText("Step");
    await expect(getStatusCard(page)).toContainText("0");
    await expect(getStatusCard(page)).toContainText("Halted");
    await expect(getStatusCard(page)).toContainText("No");

    const speedSlider = page.getByRole("slider", { name: "Speed" });
    await speedSlider.evaluate((element) => {
      const input = element as HTMLInputElement;
      input.value = "100";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(speedSlider).toHaveValue("100");

    await page.getByRole("button", { name: "Play" }).click();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Step backward" }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Pause" }).click();
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();

    await page.getByRole("button", { name: "Step forward" }).click();
    await expect(getStatusCard(page)).toContainText("1");
    await expect(getStatusCard(page)).toContainText("0");

    await page.getByRole("button", { name: "Step backward" }).click();
    await expect(getStatusCard(page)).toContainText("0");
    await expect(getStatusCard(page)).toContainText("1");

    await page.getByRole("button", { name: "Step forward" }).click();
    await page.getByRole("button", { name: "Step forward" }).click();
    await page.getByRole("button", { name: "Step forward" }).click();
    await page.getByRole("button", { name: "Step forward" }).click();

    await expect(getStatusCard(page)).toContainText("qS");
    await expect(getStatusCard(page)).toContainText("4");
    await expect(getStatusCard(page)).toContainText("Yes");

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(getStatusCard(page)).toContainText(Q0_SUBSCRIPT);
    await expect(getStatusCard(page)).toContainText("0");
    await expect(getStatusCard(page)).toContainText("No");

    await page.getByRole("button", { name: "Edit Configuration" }).click();
    await expect(
      page.getByRole("heading", { name: "Turing Machine Configuration" }),
    ).toBeVisible();
  });
});

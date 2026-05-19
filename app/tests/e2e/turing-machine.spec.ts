import { expect, test, type Locator, type Page } from "@playwright/test";

const TURING_MACHINE_ROUTE = "/fundamentals-cs/turing-machine";
const DELTA = "\u03b4";
const Q0_SUBSCRIPT = "q\u2080";
const Q1_SUBSCRIPT = "q\u2081";
const QS = "qS";
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
      page.getByText("Current Examples", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: /Example 1: Example: Bit Flip/i,
      }),
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
      name: /Exercise 1: Erase the Tape/i,
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
      page.getByText("Erase the Tape", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Build a machine that replaces the whole input word with blanks and halts once the tape is cleared.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Load solution" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Check solution" }),
    ).toBeVisible();
    await expect(
      page.getByPlaceholder("Enter input word (e.g., 1011)"),
    ).toHaveValue("");

    await page.getByRole("button", { name: "Load solution" }).click();
    await expect(
      page.getByPlaceholder("Enter input word (e.g., 1011)"),
    ).toHaveValue("10110");

    await page.getByRole("button", { name: "Check solution" }).click();
    await expect(
      page.getByRole("heading", { name: "Solution check" }),
    ).toBeVisible();
    const solutionCheckDialog = page.getByRole("dialog");
    await expect(
      solutionCheckDialog.getByRole("table", { name: "Table view" }),
    ).toContainText("Valid halt state");
    await expect(
      solutionCheckDialog.getByRole("table", { name: "Table view" }),
    ).toContainText("PASS");
    await page.getByRole("button", { name: "Close popup" }).click();

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

    const overviewHeading = page.getByRole("heading", {
      name: "What is a Turing Machine?",
    });
    const switchTabHeading = page.getByRole("heading", {
      name: "Switch Tab?",
    });

    await page.getByRole("button", { name: "Overview" }).click();
    if (!(await overviewHeading.isVisible())) {
      await expect(switchTabHeading).toBeVisible();
      await page.getByRole("button", { name: "Switch Tab" }).click();
    }
    await expect(overviewHeading).toBeVisible();
  });

  // Tests the validation regression where the currently edited tape must not limit which symbols are accepted during solution checking.
  test("checks a loaded solution successfully even after the editor tape is cleared", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);

    await page.getByRole("button", { name: "Exercises" }).click();
    await page
      .getByRole("button", {
        name: /Exercise 2: Invert a Binary Word/i,
      })
      .click();
    await page.getByRole("button", { name: "Open in simulation" }).click();

    await page.getByRole("button", { name: "Load solution" }).click();
    await page.getByPlaceholder("Enter input word (e.g., 1011)").fill("");
    await page.getByRole("button", { name: "Check solution" }).click();

    const solutionCheckDialog = page.getByRole("dialog");
    const validationTable = solutionCheckDialog.getByRole("table", {
      name: "Table view",
    });

    await expect(
      page.getByRole("heading", { name: "Solution check" }),
    ).toBeVisible();
    await expect(
      solutionCheckDialog.getByText("Invalid TM program"),
    ).toHaveCount(0);
    await expect(validationTable).toContainText("PASS");
    await expect(validationTable).not.toContainText("FAIL");
  });

  // Tests that solution grading now requires a valid halt state instead of treating matching output alone as a PASS.
  test("fails solution checks that end with a missing transition even when the tape output matches", async ({
    page,
  }) => {
    await gotoTuringMachinePage(page);

    await page.getByRole("button", { name: "Exercises" }).click();
    await page
      .getByRole("button", {
        name: /Exercise 1: Erase the Tape/i,
      })
      .click();
    await page.getByRole("button", { name: "Open in simulation" }).click();

    await page.getByRole("button", { name: "Load solution" }).click();
    const blankTransitionCell = getCellInput(page, 1, Q0_SUBSCRIPT);
    await blankTransitionCell.fill("");
    await blankTransitionCell.blur();
    await page.getByRole("button", { name: "Check solution" }).click();

    const solutionCheckDialog = page.getByRole("dialog");
    const validationTable = solutionCheckDialog.getByRole("table", {
      name: "Table view",
    });

    await expect(
      page.getByRole("heading", { name: "Solution check" }),
    ).toBeVisible();
    await expect(validationTable).toContainText("FAIL");
    await expect(validationTable).toContainText("No");
    await expect(validationTable).not.toContainText("PASS");
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

    await transitionTable(page)
      .getByRole("button", { name: "Add column" })
      .click();
    await expect(getHeaderInput(page, 3)).toHaveValue(Q1_SUBSCRIPT);
    await getHeaderInput(page, 3).fill("qAccept");
    await expect(getHeaderInput(page, 3)).toHaveValue("qAccept");

    await page.getByRole("button", { name: "Start State" }).click();
    await page.getByRole("option", { name: "qAccept" }).click();
    await expect(
      page.getByRole("button", { name: "Start State" }),
    ).toContainText("qAccept");

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
      .getByRole("button", { name: "Remove row 4" })
      .click();
    await expect(
      transitionTable(page).getByRole("button", { name: /Remove row / }),
    ).toHaveCount(3);

    await transitionTable(page)
      .getByRole("button", { name: "Remove column" })
      .last()
      .click();
    await expect(getHeaderInput(page, 3)).toHaveCount(0);

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

    await transitionCell.fill("(qH, 1, R)");
    await transitionCell.blur();
    await expect(
      page.getByText(
        "Transitions must use the format (Next State, Write Symbol, Movement) and the write symbol must be exactly one character.",
      ),
    ).toHaveCount(0);
    await expect(startSimulationButton).toBeEnabled();

    await getHaltStatesPanel(page).locator("label", { hasText: QS }).click();
    await startSimulationButton.click();

    await expect(
      page.getByText("At least one halt state must be defined."),
    ).toBeVisible();

    await getHaltStatesPanel(page).locator("label", { hasText: QS }).click();

    await page.getByPlaceholder("Enter input word (e.g., 1011)").fill("1");

    const blankTransitionCell = getCellInput(page, 1, Q0_SUBSCRIPT);
    await blankTransitionCell.fill("(qS, 1, N)");
    await blankTransitionCell.blur();

    await transitionCell.fill("");
    await transitionCell.blur();

    const unaryLoopCell = getCellInput(page, 3, Q0_SUBSCRIPT);
    await unaryLoopCell.fill("(q0, 1, R)");
    await unaryLoopCell.blur();

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

    await page.getByRole("button", { name: "Examples" }).click();
    await page
      .getByRole("button", {
        name: /Example 1: Example: Bit Flip/i,
      })
      .click();
    await page.getByRole("button", { name: "Open in simulation" }).click();

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
    await page.getByRole("button", { name: "Step forward" }).click();
    await page.getByRole("button", { name: "Step forward" }).click();
    await page.getByRole("button", { name: "Step forward" }).click();

    await expect(getStatusCard(page)).toContainText(QS);
    await expect(getStatusCard(page)).toContainText("7");
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

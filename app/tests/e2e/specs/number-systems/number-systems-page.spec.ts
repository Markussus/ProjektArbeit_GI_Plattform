import { expect, test } from "@playwright/test";
import { appTestIds } from "../../support/app-shell";

test.describe("Number Systems page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fundamentals-cs/number-systems");
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

    await test.step("The exercises tab exposes the Number Systems exercise list", async () => {
      await page.getByTestId(appTestIds.tabExercises).click();
      await expect(
        page.getByTestId("exercise-card-number-systems.ex_u03_decToBin-select"),
      ).toBeVisible();
      await expect(
        page.getByTestId("exercise-card-number-systems.ex_u06_mult-select"),
      ).toBeVisible();
    });

    await test.step("The examples tab shows grouped examples", async () => {
      await page.getByTestId(appTestIds.tabExamples).click();
      await expect(
        page.getByTestId("example-card-number-systems.example_u03_1-select"),
      ).toBeVisible();
      await expect(
        page.getByTestId("example-card-number-systems.example_u06_2-select"),
      ).toBeVisible();
    });

    await test.step("Opening the simulation tab shows the simulator", async () => {
      await page.getByTestId(appTestIds.tabSimulation).click();
      await expect(page.getByTestId(appTestIds.nsSimulator)).toBeVisible();
      await expect(
        page.getByTestId(appTestIds.simulationSelectedExercise),
      ).toHaveCount(0);
    });
  });

  test("lets users select an exercise and open it in simulation", async ({
    page,
  }) => {
    await page.getByTestId(appTestIds.tabExercises).click();

    await test.step("Selecting an exercise should expand its details", async () => {
      await page
        .getByTestId("exercise-card-number-systems.ex_u04_binToHexOct-select")
        .click();
      await expect(
        page.getByTestId("exercise-card-number-systems.ex_u04_binToHexOct-open"),
      ).toBeVisible();
    });

    await test.step("Opening an exercise in simulation should preserve the exercise context", async () => {
      await page
        .getByTestId("exercise-card-number-systems.ex_u04_binToHexOct-open")
        .click();
      await expect(page.getByTestId(appTestIds.nsSimulator)).toBeVisible();
      await expect(
        page.getByTestId(appTestIds.simulationSelectedExercise),
      ).toBeVisible();
    });
  });

  test("shows all five simulator mode tabs", async ({ page }) => {
    await page.getByTestId(appTestIds.tabSimulation).click();
    await expect(page.getByTestId(appTestIds.nsSimulator)).toBeVisible();

    await expect(page.getByTestId(appTestIds.nsTabIntegers)).toBeVisible();
    await expect(page.getByTestId(appTestIds.nsTabFractional)).toBeVisible();
    await expect(page.getByTestId(appTestIds.nsNegativeTab)).toBeVisible();
    await expect(page.getByTestId(appTestIds.nsTabIeee754)).toBeVisible();
    await expect(page.getByTestId(appTestIds.nsArithmeticTab)).toBeVisible();
  });

  test("integer converter converts between bases", async ({ page }) => {
    await page.getByTestId(appTestIds.tabSimulation).click();
    await expect(page.getByTestId(appTestIds.nsSimulator)).toBeVisible();

    await test.step("Default view shows integer converter with decimal input", async () => {
      await expect(
        page.getByTestId(appTestIds.nsConverterValueInput),
      ).toBeVisible();
      await expect(
        page.getByTestId(appTestIds.nsConverterResult),
      ).toBeVisible();
    });

    await test.step("Entering a decimal value shows binary result", async () => {
      await page.getByTestId(appTestIds.nsConverterValueInput).fill("42");
      await expect(
        page.getByTestId(appTestIds.nsConverterResult),
      ).toContainText("101010");
    });

    await test.step("Changing target base to hex shows hex result", async () => {
      await page.getByTestId("ns-integer-target-base").click();
      await page.getByRole("option", { name: /Hexadezimal|Hex/ }).click();
      await expect(
        page.getByTestId(appTestIds.nsConverterResult),
      ).toContainText("2A");
    });
  });

  test("fractional converter toggles between decToBin and binToDec", async ({
    page,
  }) => {
    await page.getByTestId(appTestIds.tabSimulation).click();
    await expect(page.getByTestId(appTestIds.nsSimulator)).toBeVisible();
    await page.getByTestId(appTestIds.nsTabFractional).click();

    await test.step("Default mode is decToBin with result visible", async () => {
      await expect(
        page.getByTestId(appTestIds.nsFractionalInput),
      ).toBeVisible();
      await expect(
        page.getByTestId(appTestIds.nsFractionalResult),
      ).toBeVisible();
    });

    await test.step("10.5 decimal converts to 1010.1 binary", async () => {
      await expect(
        page.getByTestId(appTestIds.nsFractionalResult),
      ).toContainText("1010.1");
    });

    await test.step("Switching to binToDec mode changes input and result", async () => {
      await page.getByTestId(appTestIds.nsFractionalBinToDecButton).click();
      await expect(page.getByTestId(appTestIds.nsFractionalInput)).toHaveValue(
        /1010\.1/,
      );
      await expect(
        page.getByTestId(appTestIds.nsFractionalResult),
      ).toContainText("10.5");
    });
  });

  test("IEEE754 converter encodes decimal to binary and decodes back", async ({
    page,
  }) => {
    await page.getByTestId(appTestIds.tabSimulation).click();
    await expect(page.getByTestId(appTestIds.nsSimulator)).toBeVisible();
    await page.getByTestId(appTestIds.nsTabIeee754).click();

    await test.step("Default mode is decToIeee with result visible", async () => {
      await expect(page.getByTestId(appTestIds.nsIeee754Input)).toBeVisible();
      await expect(page.getByTestId(appTestIds.nsIeee754Result)).toBeVisible();
    });

    await test.step("12.5 decimal produces IEEE754 representation", async () => {
      await expect(page.getByTestId(appTestIds.nsIeee754Result)).toBeVisible();
    });

    await test.step("Switching to ieeeToDec mode accepts 32-bit binary", async () => {
      await page.getByTestId(appTestIds.nsIeee754IeeeToDecButton).click();
      await expect(page.getByTestId(appTestIds.nsIeee754Input)).toBeVisible();
    });
  });

  test("negative numbers shows three representations", async ({ page }) => {
    await page.getByTestId(appTestIds.tabSimulation).click();
    await expect(page.getByTestId(appTestIds.nsSimulator)).toBeVisible();
    await page.getByTestId(appTestIds.nsNegativeTab).click();

    await test.step("Input field and result rows are visible", async () => {
      await expect(
        page.getByTestId(appTestIds.nsNegativeDecimalInput),
      ).toBeVisible();
      await expect(
        page.getByTestId("ns-negative-sign-magnitude"),
      ).toBeVisible();
      await expect(
        page.getByTestId("ns-negative-ones-complement"),
      ).toBeVisible();
      await expect(
        page.getByTestId("ns-negative-twos-complement"),
      ).toBeVisible();
    });

    await test.step("Negative five produces correct representations", async () => {
      await page.getByTestId(appTestIds.nsNegativeDecimalInput).fill("-5");
      await expect(
        page.getByTestId("ns-negative-twos-complement"),
      ).toContainText("11111011");
    });
  });

  test("arithmetic mode selector is visible", async ({ page }) => {
    await page.getByTestId(appTestIds.tabSimulation).click();
    await expect(page.getByTestId(appTestIds.nsSimulator)).toBeVisible();
    await page.getByTestId(appTestIds.nsArithmeticTab).click();

    await test.step("Arithmetic mode dropdown is visible", async () => {
      await expect(
        page.getByText(/Addition|Subtraktion|Multiplikation/),
      ).toBeVisible();
    });
  });

  test("example opens in simulation with pre-filled values", async ({
    page,
  }) => {
    await page.getByTestId(appTestIds.tabExamples).click();

    await test.step("Select and open example u03_1", async () => {
      await page
        .getByTestId("example-card-number-systems.example_u03_1-select")
        .click();
      await expect(
        page.getByTestId("example-card-number-systems.example_u03_1-open"),
      ).toBeVisible();
      await page.getByTestId("example-card-number-systems.example_u03_1-open").click();
    });

    await test.step("Simulator shows pre-filled decimal value 26", async () => {
      await expect(page.getByTestId(appTestIds.nsSimulator)).toBeVisible();
      await expect(
        page.getByTestId(appTestIds.nsConverterValueInput),
      ).toHaveValue("26");
    });
  });
});

import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";
import { appTestIds } from "../../support/app-shell";

function encodeJavaTransfer(sourceCode: string) {
  return `j1.${gzipSync(Buffer.from(sourceCode, "utf8")).toString("base64url")}`;
}

test.describe("Java page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/programming-1/java-programming");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("switches between overview, exercises, and simulation tabs", async ({
    page,
  }) => {
    await test.step("The overview tab is reachable on initial load", async () => {
      await expect(page.getByTestId(appTestIds.tabOverview)).toBeVisible();
      await expect(page.getByTestId(appTestIds.tabExercises)).toBeVisible();
      await expect(page.getByTestId(appTestIds.tabSimulation)).toBeVisible();
    });

    await test.step("The exercises tab exposes the Java exercise list", async () => {
      await page.getByTestId(appTestIds.tabExercises).click();
      await expect(
        page.getByTestId("exercise-card-java.exercise1-select"),
      ).toBeVisible();
      await expect(
        page.getByTestId("exercise-card-java.exercise5-select"),
      ).toBeVisible();
    });

    await test.step("Opening the simulation tab directly keeps the workspace in its neutral state", async () => {
      await page.getByTestId(appTestIds.tabSimulation).click();
      await expect(page.getByTestId(appTestIds.javaSimulator)).toBeVisible();
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
      await page.getByTestId("exercise-card-java.exercise4-select").click();
      await expect(
        page.getByTestId("exercise-card-java.exercise4-open"),
      ).toBeVisible();
    });

    await test.step("Opening an exercise in simulation should preserve the exercise context", async () => {
      await page.getByTestId("exercise-card-java.exercise4-open").click();
      await expect(page.getByTestId(appTestIds.javaSimulator)).toBeVisible();
      await expect(
        page.getByTestId(appTestIds.simulationSelectedExercise),
      ).toContainText(/Array sortieren|Sort an array/u);
      await expect(page.getByTestId(appTestIds.javaEditorPanel)).toBeVisible();
    });
  });

  test("shows the main Java simulator surface for the user", async ({
    page,
  }) => {
    await page.getByTestId(appTestIds.tabSimulation).click();

    await expect(
      page.getByTestId(appTestIds.javaEditorContainer),
    ).toBeVisible();
    await expect(page.getByTestId(appTestIds.javaTransferInput)).toBeVisible();
    await expect(page.getByTestId(appTestIds.javaTransferExport)).toBeVisible();
    await expect(page.getByTestId(appTestIds.javaTransferImport)).toBeVisible();
    await expect(page.getByTestId(appTestIds.javaRunButton)).toBeVisible();
    await expect(page.getByTestId(appTestIds.javaStopButton)).toBeVisible();
    await expect(page.getByTestId(appTestIds.javaConsolePanel)).toBeVisible();
    await expect(page.getByTestId(appTestIds.javaConsoleStdout)).toBeVisible();
    await expect(page.getByTestId(appTestIds.javaConsoleStderr)).toBeVisible();
    await expect(page.getByTestId(appTestIds.javaConsoleIssues)).toBeVisible();
  });

  test("supports transfer import/export and executing both valid and invalid Java code", async ({
    page,
  }) => {
    await page.getByTestId(appTestIds.tabSimulation).click();

    await test.step("Export should generate a Java transfer string", async () => {
      await page.getByTestId(appTestIds.javaTransferExport).click();
      await expect(page.getByTestId(appTestIds.javaTransferInput)).toHaveValue(
        /^j[01]\./,
      );
    });

    await test.step("Importing runnable code should allow a successful execution with stdout output", async () => {
      const runnableCode = `public class Main {
  public static void main(String[] args) {
    System.out.println("E2E success");
  }
}
`;

      await page
        .getByTestId(appTestIds.javaTransferInput)
        .fill(encodeJavaTransfer(runnableCode));
      await page.getByTestId(appTestIds.javaTransferImport).click();
      await expect(
        page.getByTestId(appTestIds.javaTransferStatus),
      ).toBeVisible();
      await page.getByTestId(appTestIds.javaRunButton).click();

      await expect(
        page.getByTestId(appTestIds.javaConsoleStdout),
      ).toContainText("E2E success", { timeout: 15000 });
    });

    await test.step("Importing invalid Java should surface a diagnostic after running", async () => {
      const invalidCode = "this is not valid java {{{";

      await page
        .getByTestId(appTestIds.javaTransferInput)
        .fill(encodeJavaTransfer(invalidCode));
      await page.getByTestId(appTestIds.javaTransferImport).click();
      await expect(
        page.getByTestId(appTestIds.javaTransferStatus),
      ).toBeVisible();
      await page.getByTestId(appTestIds.javaRunButton).click();

      await expect(
        page.getByTestId(appTestIds.javaConsoleIssues),
      ).toContainText("parse_error", { timeout: 15000 });
    });
  });
});

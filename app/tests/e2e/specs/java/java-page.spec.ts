import { deflateRawSync } from "node:zlib";
import { expect, test } from "@playwright/test";
import {
  appTestIds,
  exportActiveSimulator,
  importFromHeader,
} from "../../support/app-shell";

function encodeRawJavaTransfer(sourceCode: string) {
  return `C${deflateRawSync(Buffer.from(sourceCode, "utf8")).toString("base64url")}`;
}

function encodeJavaTransfer(sourceCode: string) {
  return `AH_${encodeRawJavaTransfer(sourceCode)}`;
}

test.describe("Java page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/programming-1/java-programming");
    await expect(page.getByTestId("java-topic-page")).toBeVisible();
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
        page.getByTestId("java-exercise-card-java.exercise1-select"),
      ).toBeVisible();
      await expect(
        page.getByTestId("java-exercise-card-java.exercise5-select"),
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
      await page
        .getByTestId("java-exercise-card-java.exercise4-select")
        .click();
      await expect(
        page.getByTestId("java-exercise-card-java.exercise4-open"),
      ).toBeVisible();
    });

    await test.step("Opening an exercise in simulation should preserve the exercise context", async () => {
      await page.getByTestId("java-exercise-card-java.exercise4-open").click();
      await expect(page.getByTestId(appTestIds.javaSimulator)).toBeVisible();
      await expect(
        page.getByTestId(appTestIds.simulationSelectedExercise),
      ).toContainText(/Array sortieren|Sort an array/);
      await expect(page.getByTestId(appTestIds.javaEditorPanel)).toBeVisible();
    });
  });

  test("lets users select an example and preload it in simulation", async ({
    page,
  }) => {
    await page.getByTestId(appTestIds.tabExamples).click();

    await page
      .getByTestId("java-example-card-java.example3Title-select")
      .click();
    await expect(
      page.getByTestId("java-example-card-java.example3Title-open"),
    ).toBeVisible();

    await page.getByTestId("java-example-card-java.example3Title-open").click();
    await expect(page.getByTestId(appTestIds.javaSimulator)).toBeVisible();
    await expect(
      page.getByTestId(appTestIds.simulationSelectedExercise),
    ).toContainText(/Array sortieren|Sorting an array/);
    await expect(page.getByTestId(appTestIds.javaEditorPanel)).toBeVisible();
  });

  test("shows the main Java simulator surface for the user", async ({
    page,
  }) => {
    await page.getByTestId(appTestIds.tabSimulation).click();

    await expect(page.getByTestId(appTestIds.javaCompilerStatus)).toBeVisible();
    await expect(
      page.getByTestId(appTestIds.javaCommandOverviewButton),
    ).toBeVisible();
    await expect(page.getByTestId(appTestIds.javaTimeoutInput)).toHaveValue(
      "60",
    );
    await expect(
      page.getByTestId(appTestIds.javaEditorContainer),
    ).toBeVisible();
    await expect(
      page.getByTestId(appTestIds.headerTransferInput),
    ).toBeVisible();
    await expect(
      page.getByTestId(appTestIds.headerTransferExport),
    ).toBeEnabled();
    await expect(
      page.getByTestId(appTestIds.headerTransferImport),
    ).toBeDisabled();
    await expect(page.locator('[data-testid^="java-transfer-"]')).toHaveCount(
      0,
    );
    await expect(page.getByTestId(appTestIds.javaRunButton)).toBeVisible();
    await expect(page.getByTestId(appTestIds.javaStopButton)).toBeVisible();
    await expect(page.getByTestId(appTestIds.javaConsolePanel)).toBeVisible();
    await expect(page.getByTestId(appTestIds.javaConsoleStdout)).toBeVisible();
    await expect(page.getByTestId(appTestIds.javaConsoleStderr)).toBeVisible();
    await expect(page.getByTestId(appTestIds.javaConsoleIssues)).toBeVisible();
  });

  test("shows Java browser compiler version and command limitations", async ({
    page,
  }) => {
    await page.getByTestId(appTestIds.tabSimulation).click();
    await page.getByTestId(appTestIds.javaCommandOverviewButton).click();

    await expect(
      page.getByTestId(appTestIds.javaCommandOverviewDialog),
    ).toBeVisible();
    await expect(
      page.getByTestId(appTestIds.javaCommandOverviewDialog),
    ).toContainText(/JDK 25/);
    await expect(
      page.getByTestId(appTestIds.javaCommandOverviewDialog),
    ).toContainText(/ArrayList|Listen/);
    await expect(
      page.getByTestId(appTestIds.javaCommandOverviewDialog),
    ).toContainText(/javac/);
    await expect(
      page.getByTestId(appTestIds.javaCommandOverviewDialog),
    ).toContainText(/Does not work|Geht nicht/);
  });

  test("supports transfer import/export and executing both valid and invalid Java code", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.getByTestId(appTestIds.tabSimulation).click();
    await expect(page.getByTestId(appTestIds.javaCompilerStatus)).toContainText(
      /ready|loading/,
    );
    await expect(page.getByTestId(appTestIds.javaCompilerStatus)).toContainText(
      "ready",
      { timeout: 120000 },
    );

    await test.step("Export should generate a Java transfer string", async () => {
      await expect(exportActiveSimulator(page)).resolves.toMatch(
        /^AH_[ABC][A-Za-z0-9_-]*$/,
      );
    });

    await test.step("Importing runnable code should allow a successful execution with stdout output", async () => {
      const runnableCode = `public class Main {
  public static void main(String[] args) {
    System.out.println("E2E success");
  }
}
`;

      await importFromHeader(page, encodeJavaTransfer(runnableCode));
      await page.getByTestId(appTestIds.javaRunButton).click();

      await expect(
        page.getByTestId(appTestIds.javaConsoleStdout),
      ).toContainText("E2E success", { timeout: 120000 });
    });

    await test.step("An exported program can be imported again without changing its behavior", async () => {
      const exportedProgram = await exportActiveSimulator(page);
      expect(exportedProgram).toMatch(/^AH_[ABC][A-Za-z0-9_-]*$/);

      await importFromHeader(page, `${exportedProgram} `);
      await page.getByTestId(appTestIds.javaRunButton).click();

      await expect(
        page.getByTestId(appTestIds.javaConsoleStdout),
      ).toContainText("E2E success", { timeout: 120000 });
    });

    await test.step("Providing program input should support simple Scanner exercises", async () => {
      const scannerCode = `import java.util.Scanner;

public class Main {
  public static void main(String[] args) {
    Scanner scanner = new Scanner(System.in);
    String text = scanner.nextLine();
    System.out.println(text.toUpperCase());
  }
}
`;

      await importFromHeader(page, encodeJavaTransfer(scannerCode));
      await page.getByTestId(appTestIds.javaStdinInput).fill("e2e input\n");
      await page.getByTestId(appTestIds.javaRunButton).click();

      await expect(
        page.getByTestId(appTestIds.javaConsoleStdout),
      ).toContainText("E2E INPUT", { timeout: 120000 });
    });

    await test.step("Scanner.nextInt reads a numeric token from program input", async () => {
      const scannerCode = `import java.util.Scanner;

public class Main {
  public static void main(String[] args) {
    Scanner scanner = new Scanner(System.in);
    int number = scanner.nextInt();
    System.out.println(number * 2);
  }
}
`;

      await importFromHeader(page, encodeJavaTransfer(scannerCode));
      await page.getByTestId(appTestIds.javaStdinInput).fill("21\n");
      await page.getByTestId(appTestIds.javaRunButton).click();

      await expect(
        page.getByTestId(appTestIds.javaConsoleStdout),
      ).toContainText("42", { timeout: 120000 });
    });

    await test.step("Importing invalid Java should surface a diagnostic after running", async () => {
      const invalidCode = "this is not valid java {{{";

      await importFromHeader(page, encodeJavaTransfer(invalidCode));
      await page.getByTestId(appTestIds.javaRunButton).click();

      await expect(
        page.getByTestId(appTestIds.javaConsoleIssues),
      ).toContainText(/javac_diagnostic|main_class_missing/, {
        timeout: 120000,
      });
      await expect(
        page.getByTestId(appTestIds.javaConsoleStderr),
      ).toContainText("Java compilation failed", { timeout: 120000 });
    });

    await test.step("A runtime failure is reported separately from compiler diagnostics", async () => {
      const runtimeErrorCode = `public class Main {
  public static void main(String[] args) {
    int zero = 0;
    System.out.println(1 / zero);
  }
}
`;

      await importFromHeader(page, encodeJavaTransfer(runtimeErrorCode));
      await page.getByTestId(appTestIds.javaRunButton).click();

      await expect(
        page.getByTestId(appTestIds.javaConsoleIssues),
      ).toContainText("wasm_runtime_failed", { timeout: 120000 });
      await expect(
        page.getByTestId(appTestIds.javaExecutionPhase),
      ).toContainText(/error/i);
    });
  });

  test("supports stop, timeout, and reset without leaving the Java page", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const endlessLoop = `public class Main {
  public static void main(String[] args) {
    while (true) {}
  }
}
`;

    await page.getByTestId(appTestIds.tabSimulation).click();
    await expect(page.getByTestId(appTestIds.javaCompilerStatus)).toContainText(
      /ready|bereit/i,
      { timeout: 120000 },
    );
    await importFromHeader(page, encodeJavaTransfer(endlessLoop));

    await test.step("Timeout terminates an endless program", async () => {
      await page.getByTestId(appTestIds.javaTimeoutInput).fill("1");
      await page.getByTestId(appTestIds.javaRunButton).click();
      await expect(page.getByTestId("java-timeout-warning")).toBeVisible({
        timeout: 120000,
      });
      await expect(
        page.getByTestId(appTestIds.javaExecutionPhase),
      ).toContainText(/timeout/i);
    });

    await test.step("Stop terminates a running program without crashing React", async () => {
      await expect(
        page.getByTestId(appTestIds.javaCompilerStatus),
      ).toContainText(/ready|bereit/i, { timeout: 120000 });
      await page.getByTestId(appTestIds.javaTimeoutInput).fill("60");
      await page.getByTestId(appTestIds.javaRunButton).click();
      await expect(
        page.getByTestId(appTestIds.javaExecutionPhase),
      ).toContainText(/running/i, { timeout: 120000 });
      await page.getByTestId(appTestIds.javaStopButton).click();

      await expect(
        page.getByTestId(appTestIds.javaExecutionPhase),
      ).toContainText(/stopped/i);
      await expect(page.getByTestId(appTestIds.javaSimulator)).toBeVisible();
    });

    await test.step("Reset restores code settings and console state", async () => {
      await page.getByTestId("simulation-reset").click();

      await expect(
        page.getByTestId(appTestIds.javaExecutionPhase),
      ).toContainText(/idle/i);
      await expect(page.getByTestId(appTestIds.javaStdinInput)).toHaveValue("");
      await expect(page.getByTestId(appTestIds.javaTimeoutInput)).toHaveValue(
        "60",
      );
      await expect(
        page.getByTestId(appTestIds.javaConsoleIssues),
      ).toContainText(/No diagnostics|Keine Diagnosen/);
    });
  });

  test("restores free-simulator Java code from LocalStorage", async ({
    page,
  }) => {
    const persistedCode = `public class Main {
  public static void main(String[] args) {
    System.out.println("restored from storage");
  }
}
`;

    await page.getByTestId(appTestIds.tabSimulation).click();
    await expect(page.getByTestId(appTestIds.javaCompilerStatus)).toContainText(
      /ready|bereit/i,
      { timeout: 120000 },
    );
    await importFromHeader(page, encodeJavaTransfer(persistedCode));
    await page.getByTestId(appTestIds.javaRunButton).click();
    await expect(page.getByTestId(appTestIds.javaConsoleStdout)).toContainText(
      "restored from storage",
      { timeout: 120000 },
    );
    await page.reload();
    await page.getByTestId(appTestIds.tabSimulation).click();
    await expect(page.getByTestId(appTestIds.javaCompilerStatus)).toContainText(
      /ready|bereit/i,
      { timeout: 120000 },
    );
    await page.getByTestId(appTestIds.javaRunButton).click();

    await expect(page.getByTestId(appTestIds.javaConsoleStdout)).toContainText(
      "restored from storage",
      { timeout: 120000 },
    );
  });

  test("always reloads examples from their built-in code without storing changes", async ({
    page,
  }) => {
    await page.getByTestId(appTestIds.tabSimulation).click();
    await page.getByTestId(appTestIds.tabExamples).click();
    await page
      .getByTestId("java-example-card-java.example1Title-select")
      .click();
    await page.getByTestId("java-example-card-java.example1Title-open").click();
    const storedFreeSimulation = await page.evaluate(() =>
      window.localStorage.getItem("TrainingCenterStorage"),
    );

    const builtInExampleTransfer = await exportActiveSimulator(page);
    expect(builtInExampleTransfer).toMatch(/^AH[A-Za-z0-9_-]+$/);

    await page.locator(".monaco-editor .view-lines").click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type(
      "public class Main { public static void main(String[] args) {} }",
    );
    expect(await exportActiveSimulator(page)).not.toBe(builtInExampleTransfer);

    await page.getByTestId(appTestIds.tabOverview).click();
    await page.getByTestId(appTestIds.tabExamples).click();
    await page
      .getByTestId("java-example-card-java.example1Title-select")
      .click();
    await page.getByTestId("java-example-card-java.example1Title-open").click();
    await expect(exportActiveSimulator(page)).resolves.toBe(
      builtInExampleTransfer,
    );
    expect(
      await page.evaluate(() =>
        window.localStorage.getItem("TrainingCenterStorage"),
      ),
    ).toBe(storedFreeSimulation);
  });

  test("resets all Java exercises while preserving simulator and other-topic progress", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.localStorage.setItem(
        "TrainingCenterStorage",
        JSON.stringify([
          "AHAexercise-0",
          "AHBexercise-1",
          "AH_free-simulator",
          "AAAother-topic",
        ]),
      );
    });

    await page.getByTestId(appTestIds.tabExercises).click();
    await page.getByTestId("java-reset-all-exercises").click();
    await page.getByTestId("java-reset-all-exercises-confirm").click();

    expect(
      await page.evaluate(() =>
        JSON.parse(
          window.localStorage.getItem("TrainingCenterStorage") ?? "[]",
        ),
      ),
    ).toEqual(["AH_free-simulator", "AAAother-topic"]);
  });
});

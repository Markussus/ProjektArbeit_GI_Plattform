import { expect, test, type Page } from "@playwright/test";
import {
  appTestIds,
  exportActiveSimulator,
  importFromHeader,
} from "./support/app-shell";

const simulatorRoutes = [
  ["Turing Machine", "/fundamentals-cs/turing-machine"],
  ["Finite Automata", "/fundamentals-cs/finite-automata"],
  ["Regular Languages", "/fundamentals-cs/regular-languages"],
  ["Number Systems", "/fundamentals-cs/number-systems"],
  ["Moore", "/fundamentals-cs/moore-mealy"],
  ["DNF", "/fundamentals-cs/dnf"],
  ["Encoding", "/fundamentals-cs/encoding"],
  ["Java", "/programming-1/java-programming"],
] as const;

// Regular Languages opens on a blank grammar, and a blank workspace has nothing
// to export, so it gets one typed in before the roundtrip.
const seedBeforeExport: Partial<
  Record<(typeof simulatorRoutes)[number][0], (page: Page) => Promise<void>>
> = {
  "Regular Languages": (page) =>
    page
      .getByTestId("rl-grammar-to-language-source")
      .fill(["S -> aS | bA", "A -> bA | ε"].join("\n")),
};

test.describe("global simulator import and export", () => {
  test("keeps export disabled without an active simulation and unregisters on tab exit", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByTestId(appTestIds.headerTransferExport),
    ).toBeDisabled();
    await expect(
      page.getByTestId(appTestIds.headerTransferImport),
    ).toBeDisabled();

    await page.goto("/programming-1/java-programming");
    await page.getByTestId(appTestIds.tabSimulation).click();
    await expect(
      page.getByTestId(appTestIds.headerTransferExport),
    ).toBeEnabled();

    await page.getByTestId(appTestIds.tabOverview).click();
    await expect(
      page.getByTestId(appTestIds.headerTransferExport),
    ).toBeDisabled();
  });

  test("shows the exported string without enabling import", async ({
    page,
  }) => {
    await page.goto("/fundamentals-cs/number-systems");
    await page.getByTestId(appTestIds.tabSimulation).click();

    await page.getByTestId(appTestIds.headerTransferExport).click();

    const transferInput = page.getByTestId(appTestIds.headerTransferInput);
    await expect(transferInput).not.toHaveValue("");
    await expect(transferInput).toHaveAttribute("readonly");
    await expect(
      page.locator('[data-testid="header-transfer-input"]'),
    ).toHaveCount(1);
    await expect(
      page.getByTestId(appTestIds.headerTransferImport),
    ).toBeDisabled();
  });

  for (const [simulatorName, route] of simulatorRoutes) {
    test(`${simulatorName} uses the global clipboard roundtrip`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.getByTestId(appTestIds.tabSimulation).click();
      await seedBeforeExport[simulatorName]?.(page);
      await expect(
        page.getByTestId(appTestIds.headerTransferExport),
      ).toBeEnabled();
      await expect(
        page.locator(
          '[data-testid*="-transfer-"]:not([data-testid^="header-transfer-"])',
        ),
      ).toHaveCount(0);

      const transferValue = await exportActiveSimulator(page);
      expect(transferValue).toMatch(/^[A-Za-z0-9_-]{4,}$/);

      await page.goto("/");
      await expect(
        page.getByTestId(appTestIds.headerTransferExport),
      ).toBeDisabled();
      await importFromHeader(page, transferValue);

      await expect(page).toHaveURL(route);
      await expect(
        page.getByTestId(appTestIds.headerTransferExport),
      ).toBeEnabled();
      await expect(
        page.getByTestId(appTestIds.headerTransferInput),
      ).toHaveValue("");
    });
  }

  test("a Mealy export reopens the Mealy mode", async ({ page }) => {
    await page.goto("/fundamentals-cs/moore-mealy");
    await page.getByTestId(appTestIds.tabSimulation).click();
    await page.getByTestId("moore-machine-tab-mealy").click();
    await expect(page.getByTestId("mealy-simulator")).toBeVisible();

    const transferValue = await exportActiveSimulator(page);
    await page.goto("/");
    await importFromHeader(page, transferValue);

    await expect(page).toHaveURL("/fundamentals-cs/moore-mealy");
    await expect(page.getByTestId("mealy-simulator")).toBeVisible();
    await expect(page.getByTestId("moore-machine-tab-mealy")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

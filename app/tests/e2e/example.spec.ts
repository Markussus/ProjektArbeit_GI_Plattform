import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("i18nextLng", "en");
  });
});

test("opens a guided DNF example in the simulation", async ({ page }) => {
  await page.goto("/fundamentals-cs/dnf");

  await page.getByRole("button", { name: /^Examples$/ }).click();
  await expect(page.getByText("Guided lecture examples")).toBeVisible();

  await page
    .getByRole("button", { name: "Open in simulation" })
    .first()
    .click();

  await expect(page.getByRole("button", { name: /^Simulation$/ })).toHaveClass(
    /text-tab-active/,
  );
  await expect(page.locator("#dnf-expression-input")).toHaveValue(
    "a ∨ (b ∧ c)",
  );
  await expect(page.getByText("Canonical DNF").first()).toBeVisible();
});

test("covers DNF simulation safeguards for large and invalid inputs", async ({
  page,
}) => {
  await page.goto("/fundamentals-cs/dnf");

  await page.getByRole("button", { name: /^Simulation$/ }).click();
  const input = page.locator("#dnf-expression-input");

  await input.fill("~a && (b || c)");
  await input.blur();

  await expect(input).toHaveValue("¬a ∧ (b ∨ c)");
  await expect(page.getByText("Canonical DNF").first()).toBeVisible();

  await input.fill("a | b | c | d | e");
  await input.blur();

  await expect(page.getByText("Large truth table")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show all 31 terms" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show full table" }),
  ).toBeVisible();

  await input.fill("x1 | x2 | x3 | x4 | x5 | x6 | x7 | x8 | x9");
  await input.blur();

  await expect(page.getByText("Too many variables")).toBeVisible();

  await page.getByRole("button", { name: "Clear" }).click();
  await expect(page.getByText("Ready for an expression")).toBeVisible();
});

import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("i18nextLng", "en");
  });
});

test("shows guided DNF examples", async ({ page }) => {
  await page.goto("/fundamentals-cs/dnf");

  await page.getByRole("button", { name: /^Examples$/ }).click();
  await expect(page.getByText("Lecture examples")).toBeVisible();
  const lectureExample = page.locator("article").filter({
    hasText: "Expression with an AND group",
  });

  await expect(lectureExample).toBeVisible();
  await expect(lectureExample.getByText("a=0, b=1, c=1")).toBeVisible();
  await expect(
    lectureExample.getByText("¬a ∧ b ∧ c", { exact: true }),
  ).toBeVisible();
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
  await page.getByRole("button", { name: "Evaluate" }).click();
  await page.getByRole("button", { name: "Show solution as hint" }).click();
  await expect(
    page
      .locator("span")
      .filter({ hasText: /^\(¬a ∧ ¬b ∧ c\)$/ })
      .first(),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Enter a different expression" })
    .click();

  await input.fill("a | b | c | d | e");
  await input.blur();

  await page.getByRole("button", { name: "Evaluate" }).click();
  await page.getByRole("button", { name: "Show solution as hint" }).click();
  await expect(page.getByText("The DNF has 31 terms.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show all 31 terms" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show full table" }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Enter a different expression" })
    .click();

  await input.fill("x1 | x2 | x3 | x4 | x5 | x6 | x7 | x8 | x9");
  await input.blur();
  await page.getByRole("button", { name: "Evaluate" }).click();

  await expect(page.getByText("Too many variables")).toBeVisible();

  await page
    .getByRole("button", { name: "Enter a different expression" })
    .click();
  await expect(input).toHaveValue("");
});

test("solves a DNF exercise from a given truth table", async ({ page }) => {
  await page.goto("/fundamentals-cs/dnf");

  await page.getByRole("button", { name: /^Exercises$/ }).click();
  await page
    .getByRole("button", {
      name: /Exercise 5: Boolean polynomial from truth table/,
    })
    .click();
  await page.getByRole("button", { name: "Open in simulation" }).click();

  await expect(page.getByText("Given the truth table:")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "???" })).toBeVisible();

  await page
    .locator("#dnf-exercise-answer")
    .fill("(!a & b & !c) | (a & !b & !c) | (a & !b & c)");
  await page.getByRole("button", { name: "Check", exact: true }).click();

  await expect(page.getByText("All correct")).toBeVisible();
});

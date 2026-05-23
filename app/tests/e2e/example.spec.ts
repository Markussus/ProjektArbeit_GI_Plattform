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

  const lectureExample = page.getByTestId("dnf-example-lecture-expression");
  await expect(lectureExample).toBeVisible();
  await expect(
    lectureExample.getByText("Expression with an AND group"),
  ).toBeVisible();

  await lectureExample
    .getByTestId("dnf-example-lecture-expression-select")
    .click();
  await expect(
    lectureExample.getByText(
      "The expression is true when a=1 or b and c are both 1.",
    ),
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
  await expect(
    page.getByText(
      "Large DNF: all 31 terms are scrollable in the compact view.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show full DNF" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show full table" }).first(),
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
  await expect(page.getByRole("columnheader", { name: "f" })).toBeVisible();

  await page
    .locator("#dnf-exercise-answer")
    .fill("(!a & b & !c) | (a & !b & !c) | (a & !b & c)");
  await page.getByRole("button", { name: "Check", exact: true }).click();

  await expect(page.getByText("All correct")).toBeVisible();
});

import { test, expect, type Locator, type Page } from "@playwright/test";

const RL_URL = "/fundamentals-cs/regular-languages";

const visibleOnly = { visible: true } as const;

/** The grammar editor of whichever mode is currently shown. */
function grammarTextarea(page: Page): Locator {
  return page
    .locator("textarea[placeholder*='0S']")
    .filter(visibleOnly)
    .first();
}

/** The language-definition editor (Language → Grammar only). */
function languageTextarea(page: Page): Locator {
  return page.locator("textarea[placeholder^='L =']").filter(visibleOnly);
}

/** The comma-separated word list (Recognize Word only). */
function wordListInput(page: Page): Locator {
  return page.getByPlaceholder("Comma-separated words; empty = ε");
}

async function openSimulation(page: Page) {
  await page.goto(RL_URL);
  await page.getByTestId("tab-button-simulation").click();
}

async function selectMode(
  page: Page,
  name: "Grammar → Language" | "Language → Grammar" | "Recognize Word",
) {
  await page.getByRole("button", { name, exact: true }).click();
}

test.describe("Regular Languages page", () => {
  test("page loads under the regular-languages route", async ({ page }) => {
    await page.goto(RL_URL);
    await expect(page).toHaveURL(/regular-languages/);
  });

  test("shows the topic title and description", async ({ page }) => {
    await page.goto(RL_URL);
    await expect(
      page.getByRole("heading", { name: "Regular Languages", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(/right-linear grammars/i).first(),
    ).toBeVisible();
  });

  test("shows the four navigation tabs", async ({ page }) => {
    await page.goto(RL_URL);
    await expect(page.getByTestId("tab-button-overview")).toBeVisible();
    await expect(page.getByTestId("tab-button-exercises")).toBeVisible();
    await expect(page.getByTestId("tab-button-examples")).toBeVisible();
    await expect(page.getByTestId("tab-button-simulation")).toBeVisible();
  });

  test("overview tab explains what a regular language is", async ({ page }) => {
    await page.goto(RL_URL);
    await expect(page.getByText(/What are Regular Languages\?/i)).toBeVisible();
    await expect(
      page.getByText(/right-linear \(Type 3\) grammars/i),
    ).toBeVisible();
  });
});

test.describe("Regular Languages — mode selector", () => {
  test.beforeEach(async ({ page }) => {
    await openSimulation(page);
  });

  test("offers all three simulator modes", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Grammar → Language", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Language → Grammar", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Recognize Word", exact: true }),
    ).toBeVisible();
  });

  test("starts in Grammar → Language mode", async ({ page }) => {
    await expect(page.getByText("Language Enumeration")).toBeVisible();
    await expect(page.getByText("Resulting Grammar")).not.toBeVisible();
  });

  test("switching to Language → Grammar swaps the visible panel", async ({
    page,
  }) => {
    await selectMode(page, "Language → Grammar");
    await expect(page.getByText("Resulting Grammar")).toBeVisible();
    await expect(page.getByText("Language Enumeration")).not.toBeVisible();
  });

  test("switching to Recognize Word shows the word list input", async ({
    page,
  }) => {
    await selectMode(page, "Recognize Word");
    await expect(page.getByText("Words to Test")).toBeVisible();
  });

  /*
   * The modes are toggled rather than remounted precisely so in-progress edits
   * survive a switch — see the "Entscheidungen im UI" rationale. Without that,
   * returning to a mode would reset it to its default example.
   */
  test("keeps edits when switching away and back", async ({ page }) => {
    const grammar = grammarTextarea(page);
    await grammar.fill("S -> xS | y");

    await selectMode(page, "Language → Grammar");
    await expect(page.getByText("Resulting Grammar")).toBeVisible();
    await selectMode(page, "Grammar → Language");

    await expect(grammarTextarea(page)).toHaveValue("S -> xS | y");
  });
});

test.describe("Regular Languages — Grammar → Language", () => {
  test.beforeEach(async ({ page }) => {
    await openSimulation(page);
  });

  test("ships a default right-linear grammar", async ({ page }) => {
    await expect(grammarTextarea(page)).toHaveValue(
      "S -> aS | bA\nA -> bA | ε",
    );
  });

  test("enumerates the words the default grammar generates", async ({
    page,
  }) => {
    // S -> aS | bA, A -> bA | ε  generates  aⁿbᵏ  with n ≥ 0, k ≥ 1.
    for (const word of ["b", "ab", "bb", "aab"]) {
      await expect(
        page.getByText(word, { exact: true }).filter(visibleOnly).first(),
      ).toBeVisible();
    }
  });

  test("respects the maximum word length", async ({ page }) => {
    await page.getByLabel("Maximum Word Length").fill("2");
    // Only b, ab and bb are ≤ 2 symbols long.
    await expect(page.getByText("b", { exact: true })).toBeVisible();
    await expect(page.getByText("ab", { exact: true })).toBeVisible();
    await expect(page.getByText("bb", { exact: true })).toBeVisible();
    await expect(page.getByText("aab", { exact: true })).toHaveCount(0);
  });

  test("reports a complete enumeration when nothing was cut", async ({
    page,
  }) => {
    await page.getByLabel("Maximum Word Length").fill("2");
    await expect(
      page.getByText(
        /All derivable words up to the selected length are shown/i,
      ),
    ).toBeVisible();
  });

  test("reports truncation when the word cap bites", async ({ page }) => {
    await page.getByLabel("Maximum Number of Words").fill("3");
    await expect(
      page.getByText(/The output was truncated by the word limit/i),
    ).toBeVisible();
  });

  test("rejects a grammar that is not right-linear", async ({ page }) => {
    await grammarTextarea(page).fill("S -> aSb");
    await expect(
      page.getByText(/Enter a valid right-linear grammar/i),
    ).toBeVisible();
  });

  test("documents both supported grammar formats", async ({ page }) => {
    await page
      .getByText("Supported Formats")
      .filter(visibleOnly)
      .first()
      .click();
    await expect(page.getByText(/Format 1 — simplified/i)).toBeVisible();
    await expect(page.getByText(/Format 2 — structured/i)).toBeVisible();
  });
});

test.describe("Regular Languages — Language → Grammar", () => {
  test.beforeEach(async ({ page }) => {
    await openSimulation(page);
    await selectMode(page, "Language → Grammar");
  });

  test("ships a default language definition", async ({ page }) => {
    await expect(languageTextarea(page)).toHaveValue(
      'L = {"010", "0010", "00100", ..}',
    );
  });

  test("derives a grammar and reports N, Σ and S", async ({ page }) => {
    await expect(page.getByText("Resulting Grammar")).toBeVisible();
    await expect(page.getByText("N:", { exact: true })).toBeVisible();
    await expect(page.getByText("Σ:", { exact: true })).toBeVisible();
    await expect(page.getByText("S:", { exact: true })).toBeVisible();
  });

  test("converts an explicit word list into productions", async ({ page }) => {
    await languageTextarea(page).fill('L = {"ab", "abb"}');
    await expect(page.getByText("Resulting Grammar")).toBeVisible();
    // Right-linear output always uses single-terminal productions. Scope to the
    // visible pre — the collapsed "Supported Formats" panel also holds one.
    await expect(
      page.locator("pre").filter({ hasText: "->" }).filter(visibleOnly),
    ).toBeVisible();
  });

  test("starts in the Detailed grammar view", async ({ page }) => {
    await expect(page.getByTestId("rl-grammar-mode-detailed")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(
      page.getByTestId("rl-grammar-mode-simplified"),
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("switches to the Simplified grammar view", async ({ page }) => {
    await page.getByTestId("rl-grammar-mode-simplified").click();
    await expect(
      page.getByTestId("rl-grammar-mode-simplified"),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("rl-grammar-mode-detailed")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("accepts set-builder notation", async ({ page }) => {
    await languageTextarea(page).fill("L = {a^n c b^m | n, m > 0}");
    await expect(page.getByText("Resulting Grammar")).toBeVisible();
    await expect(
      page.getByText(/Enter a valid language definition/i),
    ).toHaveCount(0);
  });

  /*
   * aⁿbⁿ is the canonical non-regular language. The parser rejects a reused
   * exponent variable outright and explains why, instead of silently dropping
   * the coupling — a deliberate teaching decision, so it is worth pinning down.
   */
  test("refuses a^n b^n with an explanation", async ({ page }) => {
    await languageTextarea(page).fill("L = {a^n b^n | n > 0}");
    await expect(page.getByText(/used in more than one factor/i)).toBeVisible();
    await expect(page.getByText(/non-regular language/i)).toBeVisible();
  });

  /* Upper bounds describe finite (hence regular) languages, but are refused on
   * purpose: an enumeration states them more clearly. */
  test("refuses an upper bound and points at enumeration", async ({ page }) => {
    await languageTextarea(page).fill("L = {a^n | n < 5}");
    await expect(page.getByText(/Upper bounds/i)).toBeVisible();
  });

  test("treats an empty field as the starting state, not an error", async ({
    page,
  }) => {
    await languageTextarea(page).fill("");
    await expect(page.getByText(/Enter a language definition/i)).toHaveCount(0);
  });
});

test.describe("Regular Languages — Recognize Word", () => {
  test.beforeEach(async ({ page }) => {
    await openSimulation(page);
    await selectMode(page, "Recognize Word");
  });

  test("ships a default grammar and word list", async ({ page }) => {
    await expect(grammarTextarea(page)).toHaveValue(
      "S -> 0S | 1A\nA -> 0A | 1 | ε",
    );
    await expect(wordListInput(page)).toHaveValue("001, 010, 1, 00");
  });

  test("decides every word in the comma-separated list", async ({ page }) => {
    // S -> 0S | 1A, A -> 0A | 1 | ε  accepts 001, 010 and 1 but not 00.
    await expect(page.getByText(/\(accepting\)/)).toHaveCount(3);
    await expect(page.getByText(/\(not accepting\)/)).toHaveCount(1);
  });

  test("re-evaluates when the word list changes", async ({ page }) => {
    const words = wordListInput(page);
    await words.fill("00");
    await expect(page.getByText(/\(not accepting\)/)).toHaveCount(1);
    await expect(page.getByText(/\(accepting\)/)).toHaveCount(0);
  });

  test("explains a rejection caused by a missing transition", async ({
    page,
  }) => {
    const words = wordListInput(page);
    await words.fill("2");
    await expect(
      page.getByText(/No transition for the next symbol/i),
    ).toBeVisible();
  });

  test("renders the empty word as ε", async ({ page }) => {
    const words = wordListInput(page);
    await words.fill("");
    await expect(page.getByText("ε", { exact: true }).first()).toBeVisible();
  });

  test("rejects an invalid grammar before testing words", async ({ page }) => {
    await grammarTextarea(page).fill("S -> aSb");
    await expect(
      page.getByText(/Enter a valid right-linear grammar/i),
    ).toBeVisible();
  });
});

test.describe("Regular Languages — Exercises tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RL_URL);
    await page.getByTestId("tab-button-exercises").click();
  });

  test("groups exercises by what is given and what is asked", async ({
    page,
  }) => {
    await expect(
      page.getByTestId("rl-exercises-section-grammarToLanguage"),
    ).toBeVisible();
    await expect(
      page.getByTestId("rl-exercises-section-languageToGrammar"),
    ).toBeVisible();
    await expect(
      page.getByTestId("rl-exercises-section-applied"),
    ).toBeVisible();
  });

  test("renders exercise cards in every section", async ({ page }) => {
    await expect(
      page.getByTestId("exercise-card-g2l-finite-binary"),
    ).toBeVisible();
    await expect(
      page.getByTestId("exercise-card-l2g-zero-ones-zero"),
    ).toBeVisible();
    await expect(
      page.getByTestId("exercise-card-applied-integers"),
    ).toBeVisible();
  });

  test("offers a reset control for all exercises", async ({ page }) => {
    await expect(page.getByTestId("rl-reset-all-exercises")).toBeVisible();
  });

  test("expands a card to reveal its description", async ({ page }) => {
    await page.getByTestId("exercise-card-g2l-finite-binary-select").click();
    await expect(
      page.getByTestId("exercise-card-g2l-finite-binary-details"),
    ).toBeVisible();
  });
});

test.describe("Regular Languages — exercise workspace", () => {
  /* Opening a Grammar → Language exercise replaces the free converter with the
   * guided workspace: grammar given, enumeration asked for. */
  test.beforeEach(async ({ page }) => {
    await page.goto(RL_URL);
    await page.getByTestId("tab-button-exercises").click();
    await page.getByTestId("exercise-card-g2l-finite-binary-select").click();
    await page.getByTestId("exercise-card-g2l-finite-binary-open").click();
  });

  test("opens the guided workspace instead of the free converter", async ({
    page,
  }) => {
    await expect(page.getByText("Your Enumeration")).toBeVisible();
    await expect(page.getByText("Given Grammar").first()).toBeVisible();
  });

  test("exposes Check Solution and Load solution actions", async ({ page }) => {
    await expect(page.getByTestId("rl-check-solution")).toBeVisible();
    await expect(page.getByTestId("rl-load-solution")).toBeVisible();
  });

  test("checking an empty answer asks for at least one word", async ({
    page,
  }) => {
    await page.getByTestId("rl-check-solution").click();
    await expect(page.getByTestId("rl-solution-check-dialog")).toBeVisible();
    await expect(page.getByText(/Enter at least one word/i)).toBeVisible();
  });

  test("checking a wrong answer names the offending words", async ({
    page,
  }) => {
    await page.getByPlaceholder(/e\.g\. 100, 101, 110/i).fill("zzz");
    await page.getByTestId("rl-check-solution").click();
    await expect(page.getByTestId("rl-solution-check-dialog")).toBeVisible();
    await expect(
      page.getByText(/Not matching the target language yet/i),
    ).toBeVisible();
  });

  /* Revealing overwrites the learner's draft, so it must confirm first. */
  test("asks before revealing the solution", async ({ page }) => {
    await page.getByTestId("rl-load-solution").click();
    await expect(page.getByTestId("rl-load-solution-confirm")).toBeVisible();
    await expect(page.getByText(/Reveal the Full Solution\?/i)).toBeVisible();
  });

  test("revealing fills the answer with the enumerated words", async ({
    page,
  }) => {
    const answer = page.getByPlaceholder(/e\.g\. 100, 101, 110/i);
    await expect(answer).toHaveValue("");
    await page.getByTestId("rl-load-solution").click();
    await page.getByRole("button", { name: /Yes, Show Solution/i }).click();
    await expect(answer).not.toHaveValue("");
  });

  /* The reveal and the check share G2L_EXERCISE_ENUMERATION, so a revealed
   * solution must always pass the check it was revealed for. */
  test("a revealed solution passes its own check", async ({ page }) => {
    await page.getByTestId("rl-load-solution").click();
    await page.getByRole("button", { name: /Yes, Show Solution/i }).click();
    await page.getByTestId("rl-check-solution").click();
    await expect(page.getByText(/Looks correct!/i)).toBeVisible();
  });

  test("switching mode during an exercise asks for confirmation", async ({
    page,
  }) => {
    await selectMode(page, "Recognize Word");
    await expect(page.getByTestId("rl-mode-switch-confirm")).toBeVisible();
  });
});

test.describe("Regular Languages — Examples tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RL_URL);
    await page.getByTestId("tab-button-examples").click();
  });

  test("shows the examples tab", async ({ page }) => {
    await expect(page.getByTestId("rl-examples-tab")).toBeVisible();
  });

  test("groups examples by conversion direction", async ({ page }) => {
    await expect(
      page.getByTestId("rl-examples-section-grammarToLanguage"),
    ).toBeVisible();
    await expect(
      page.getByTestId("rl-examples-section-languageToGrammar"),
    ).toBeVisible();
    await expect(
      page.getByTestId("rl-examples-section-recognizeWord"),
    ).toBeVisible();
  });

  test("renders at least one example card per section", async ({ page }) => {
    const cards = page.locator("[data-testid^='rl-example-card-']");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(3);
  });
});

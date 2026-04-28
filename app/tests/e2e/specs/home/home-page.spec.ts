import { expect, test } from "@playwright/test";
import {
  appTestIds,
  gotoHome,
  localizedContent,
  readResolvedTheme,
  switchLanguage,
} from "../../support/app-shell";

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
  });

  test("renders the home page shell and the hero title for the active language", async ({
    page,
  }) => {
    await test.step(
      "The landing page should render its main hero content",
      async () => {
        await expect(page.getByTestId("home-page")).toBeVisible();
        await expect(page.getByTestId(appTestIds.heroTitle)).toBeVisible();
      },
    );

    await test.step(
      "The browser title should be populated for the initial language",
      async () => {
        await expect(page).toHaveTitle(/THWS/);
      },
    );
  });

  test("switches between dark and light mode from the header toggle", async ({
    page,
  }) => {
    const themeToggle = page.getByTestId(appTestIds.themeToggle);

    await test.step(
      "Clicking the theme toggle should flip the resolved theme once",
      async () => {
        const initialTheme = await readResolvedTheme(page);

        await themeToggle.click();

        const toggledTheme = initialTheme === "dark" ? "light" : "dark";
        await expect
          .poll(async () => readResolvedTheme(page))
          .toBe(toggledTheme);
      },
    );

    await test.step(
      "Clicking the theme toggle again should restore the original theme",
      async () => {
        const currentTheme = await readResolvedTheme(page);

        await themeToggle.click();

        const restoredTheme = currentTheme === "dark" ? "light" : "dark";
        await expect
          .poll(async () => readResolvedTheme(page))
          .toBe(restoredTheme);
      },
    );
  });

  test("updates the browser title and hero copy when the language changes", async ({
    page,
  }) => {
    await test.step(
      "Switching to English should update both the document title and the hero heading",
      async () => {
        const heroTitle = page.getByTestId(appTestIds.heroTitle);

        await switchLanguage(page, "en");

        await expect(page).toHaveTitle(localizedContent.en.appTitle);
        await expect(heroTitle).toContainText(
          localizedContent.en.homeHeroTitleParts[0],
        );
        await expect(heroTitle).toContainText(
          localizedContent.en.homeHeroTitleParts[1],
        );
      },
    );

    await test.step(
      "Switching back to German should restore the localized title and hero heading",
      async () => {
        const heroTitle = page.getByTestId(appTestIds.heroTitle);

        await switchLanguage(page, "de");

        await expect(page).toHaveTitle(localizedContent.de.appTitle);
        await expect(heroTitle).toContainText(
          localizedContent.de.homeHeroTitleParts[0],
        );
        await expect(heroTitle).toContainText(
          localizedContent.de.homeHeroTitleParts[1],
        );
      },
    );
  });

  test("shows module links in the dropdown and every listed module route resolves", async ({
    page,
  }) => {
    await page.getByTestId(appTestIds.moduleSelectorTrigger).click();

    const moduleLinks = page
      .getByTestId(appTestIds.moduleSelectorMenu)
      .locator('[data-testid^="module-selector-link-"]');

    await test.step(
      "The module dropdown should expose at least one navigable module entry",
      async () => {
        await expect(
          page.getByTestId(appTestIds.moduleSelectorMenu),
        ).toBeVisible();
        expect(await moduleLinks.count()).toBeGreaterThan(0);
      },
    );

    const moduleTargets = await moduleLinks.evaluateAll((links) =>
      links.map((link) => ({
        href: link.getAttribute("href"),
        moduleId: link.getAttribute("data-module-id"),
      })),
    );

    for (const target of moduleTargets) {
      if (!target.href || !target.moduleId) {
        throw new Error("A module dropdown entry is missing its target route.");
      }

      await test.step(
        `The module entry "${target.moduleId}" should open an existing route`,
        async () => {
          await page.goto(target.href);
          await expect
            .poll(() => new URL(page.url()).pathname)
            .toBe(target.href);
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          await expect(page.getByTestId(appTestIds.notFoundTitle)).toHaveCount(
            0,
          );
        },
      );
    }
  });
});

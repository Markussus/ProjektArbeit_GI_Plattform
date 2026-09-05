import { expect, test } from "@playwright/test";
import {
  appTestIds,
  localizedContent,
  switchLanguage,
} from "../../support/app-shell";

test.describe("Unknown routes", () => {
  test("renders the localized 404 page for an invalid route", async ({
    page,
  }) => {
    const invalidPath = "/does-not-exist";

    await page.goto("/");
    await switchLanguage(page, "en");
    await page.goto(invalidPath);

    await test.step("The browser should stay on the unknown route and render the 404 page", async () => {
      await expect.poll(() => new URL(page.url()).pathname).toBe(invalidPath);
      await expect(page.getByTestId(appTestIds.notFoundTitle)).toHaveText(
        localizedContent.en.notFoundTitle,
      );
    });

    await test.step("The 404 page should surface the requested invalid route", async () => {
      await expect(
        page.getByTestId(appTestIds.notFoundRequestedPath),
      ).toHaveText(invalidPath);
    });
  });
});

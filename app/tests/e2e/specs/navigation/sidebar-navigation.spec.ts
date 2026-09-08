import { expect, test } from "@playwright/test";
import {
  appTestIds,
  ensureSidebarExpanded,
  gotoHome,
  localizedContent,
  switchLanguage,
} from "../../support/app-shell";

test.describe("Sidebar navigation", () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
  });

  test("collapses and expands the sidebar on demand", async ({ page }) => {
    const sidebar = page.getByTestId(appTestIds.sidebar);
    const toggle = page.getByTestId(appTestIds.sidebarToggle);

    await test.step("The sidebar starts collapsed on the landing page", async () => {
      await expect(sidebar).toHaveAttribute("data-collapsed", "true");
    });

    await test.step("The toggle button should expand the sidebar", async () => {
      await toggle.click();
      await expect(sidebar).toHaveAttribute("data-collapsed", "false");
    });

    await test.step("The same toggle button should collapse the sidebar again", async () => {
      await toggle.click();
      await expect(sidebar).toHaveAttribute("data-collapsed", "true");
    });
  });

  test("opens the info page from the sidebar", async ({ page }) => {
    await switchLanguage(page, "de");
    await ensureSidebarExpanded(page);

    await test.step("The info link should navigate to the info route", async () => {
      await page.getByTestId(appTestIds.sidebarInfoLink).click();
      await expect
        .poll(() => new URL(page.url()).pathname)
        .toBe("/gi_learningtool/info");
    });

    await test.step("The info route should render the info page content", async () => {
      await expect(page.getByTestId(appTestIds.infoPage)).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        localizedContent.de.infoTitle,
      );
    });
  });

  test("deletes all saved training-center progress from the info page", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.localStorage.setItem(
        "TrainingCenterStorage",
        JSON.stringify(["AAAfirst", "AH_second"]),
      );
    });
    await ensureSidebarExpanded(page);
    await page.getByTestId(appTestIds.sidebarInfoLink).click();

    await page.getByTestId("help-reset-all-progress").click();
    await expect(
      page.getByTestId("help-reset-all-progress-confirmation"),
    ).toBeVisible();
    await page.getByTestId("help-reset-all-progress-confirm").click();

    expect(
      await page.evaluate(() =>
        window.localStorage.getItem("TrainingCenterStorage"),
      ),
    ).toBeNull();
  });
});

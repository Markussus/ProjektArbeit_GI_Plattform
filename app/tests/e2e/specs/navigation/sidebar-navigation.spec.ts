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

    await test.step(
      "The sidebar starts collapsed on the landing page",
      async () => {
        await expect(sidebar).toHaveAttribute("data-collapsed", "true");
      },
    );

    await test.step(
      "The toggle button should expand the sidebar",
      async () => {
        await toggle.click();
        await expect(sidebar).toHaveAttribute("data-collapsed", "false");
      },
    );

    await test.step(
      "The same toggle button should collapse the sidebar again",
      async () => {
        await toggle.click();
        await expect(sidebar).toHaveAttribute("data-collapsed", "true");
      },
    );
  });

  test("opens the documentation page from the sidebar", async ({ page }) => {
    await switchLanguage(page, "en");
    await ensureSidebarExpanded(page);

    await test.step(
      "The documentation link should navigate to the documentation route",
      async () => {
        await page.getByTestId(appTestIds.sidebarDocumentationLink).click();
        await expect
          .poll(() => new URL(page.url()).pathname)
          .toBe("/documentation");
      },
    );

    await test.step(
      "The documentation route should render the documentation page content",
      async () => {
        await expect(page.getByTestId(appTestIds.documentationPage)).toBeVisible();
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
          localizedContent.en.documentationTitle,
        );
      },
    );
  });

  test("opens the help page from the sidebar", async ({ page }) => {
    await switchLanguage(page, "de");
    await ensureSidebarExpanded(page);

    await test.step(
      "The help link should navigate to the help route",
      async () => {
        await page.getByTestId(appTestIds.sidebarHelpLink).click();
        await expect.poll(() => new URL(page.url()).pathname).toBe("/help");
      },
    );

    await test.step(
      "The help route should render the help page content",
      async () => {
        await expect(page.getByTestId(appTestIds.helpPage)).toBeVisible();
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
          localizedContent.de.helpTitle,
        );
      },
    );
  });
});

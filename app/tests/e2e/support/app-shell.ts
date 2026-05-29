import { expect, type Page } from "@playwright/test";

export const appTestIds = {
  documentationPage: "documentation-page",
  helpPage: "help-page",
  legalPage: "legal-page",
  javaCompilerStatus: "java-compiler-status",
  heroTitle: "home-hero-title",
  javaConsoleIssues: "java-console-issues",
  javaConsolePanel: "java-console-panel",
  javaConsoleStderr: "java-console-stderr",
  javaConsoleStdout: "java-console-stdout",
  javaEditorContainer: "java-editor-container",
  javaEditorPanel: "java-editor-panel",
  javaExecutionPhase: "java-execution-phase",
  javaResetButton: "java-reset-button",
  javaRunButton: "java-run-button",
  javaSimulator: "java-simulator",
  javaStopButton: "java-stop-button",
  javaTimeoutInput: "java-timeout-input",
  javaTransferExport: "java-transfer-export",
  javaTransferImport: "java-transfer-import",
  javaTransferInput: "java-transfer-input",
  javaTransferStatus: "java-transfer-status",
  languageSelectMenu: "language-select-menu",
  languageSelectTrigger: "language-select-trigger",
  moduleSelectorMenu: "module-selector-menu",
  moduleSelectorTrigger: "module-selector-trigger",
  notFoundRequestedPath: "not-found-requested-path",
  notFoundTitle: "not-found-title",
  nsArithmeticTab: "ns-tab-arithmetic",
  nsConverterResult: "ns-converter-result",
  nsConverterTargetBase: "ns-converter-target-base",
  nsConverterValueInput: "ns-converter-value-input",
  nsFractionalBinToDecButton: "ns-frac-bin-to-dec-button",
  nsFractionalDecToBinButton: "ns-frac-dec-to-bin-button",
  nsFractionalInput: "ns-fractional-input",
  nsFractionalResult: "ns-fractional-result",
  nsIeee754DecToIeeeButton: "ns-ieee-dec-to-ieee-button",
  nsIeee754IeeeToDecButton: "ns-ieee-ieee-to-dec-button",
  nsIeee754Input: "ns-ieee-input",
  nsIeee754Result: "ns-ieee-result",
  nsIntegerBaseSelect: "ns-integer-base-select",
  nsNegativeDecimalInput: "ns-negative-decimal-input",
  nsNegativeResult: "ns-negative-result",
  nsNegativeTab: "ns-tab-negative",
  nsSimulator: "ns-simulator",
  nsTabFractional: "ns-tab-fractional",
  nsTabIntegers: "ns-tab-integers",
  nsTabIeee754: "ns-tab-ieee754",
  nsValidationInput: "ns-validation-input",
  nsValidationVerifyButton: "ns-validation-verify-button",
  nsValidationShowSolutionButton: "ns-validation-show-solution-button",
  sidebar: "sidebar",
  sidebarDocumentationLink: "sidebar-documentation-link",
  sidebarHelpLink: "sidebar-help-link",
  sidebarLegalLink: "sidebar-legal-link",
  sidebarToggle: "sidebar-toggle",
  simulationSelectedExercise: "simulation-selected-exercise",
  tabExamples: "tab-button-examples",
  tabExercises: "tab-button-exercises",
  tabOverview: "tab-button-overview",
  tabSimulation: "tab-button-simulation",
  themeToggle: "theme-toggle",
} as const;

export const localizedContent = {
  de: {
    appTitle: "THWS - Traingscenter",
    documentationTitle: "Dokumentation",
    helpTitle: "Hilfe",
    homeHeroTitleParts: [
      "Komplexe Systeme meistern",
      "durch interaktives Lernen.",
    ],
    notFoundTitle: "404 – Diese Seite gibt es nicht",
  },
  en: {
    appTitle: "THWS - Traing Center",
    documentationTitle: "Documentation",
    helpTitle: "Help",
    homeHeroTitleParts: [
      "Master Complex Systems",
      "through Interactive Learning.",
    ],
    notFoundTitle: "404 – This page does not exist",
  },
} as const;

export async function gotoHome(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId(appTestIds.heroTitle)).toBeVisible();
}

export async function ensureSidebarExpanded(page: Page) {
  const sidebar = page.getByTestId(appTestIds.sidebar);

  if ((await sidebar.getAttribute("data-collapsed")) === "true") {
    await page.getByTestId(appTestIds.sidebarToggle).click();
    await expect(sidebar).toHaveAttribute("data-collapsed", "false");
  }
}

export async function switchLanguage(page: Page, language: "de" | "en") {
  await page.getByTestId(appTestIds.languageSelectTrigger).click();
  await expect(page.getByTestId(appTestIds.languageSelectMenu)).toBeVisible();
  await page
    .getByTestId(appTestIds.languageSelectMenu)
    .getByRole("option", { name: language.toUpperCase() })
    .click();
}

export async function readResolvedTheme(page: Page) {
  return page.evaluate(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );
}

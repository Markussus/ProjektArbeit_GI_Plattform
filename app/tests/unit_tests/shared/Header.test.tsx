/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/shared/Header/Header";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "common.app.title": "Training Center",
        "common.nav.home": "Startseite",
        "common.modules.fundamentalsCs.title": "Grundlagen der Informatik",
        "common.simulation.transfer.export": "Exportieren",
        "common.simulation.transfer.import": "Importieren",
        "common.language.select": "Sprache auswählen",
        "common.theme.switchToDark": "Zu Dunkelmodus wechseln",
        "common.theme.switchToLight": "Zu Hellmodus wechseln",
      };
      return translations[key] ?? key;
    },
    i18n: {
      language: "de",
      resolvedLanguage: "de",
      changeLanguage: vi.fn(),
    },
  }),
}));

describe("Header", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders only the module title without Training Center prefix", () => {
    render(
      <MemoryRouter initialEntries={["/fundamentals-cs/regular-languages"]}>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText("Grundlagen der Informatik")).toBeInTheDocument();
    expect(screen.queryByText("Training Center")).not.toBeInTheDocument();
    expect(screen.queryByText("/")).not.toBeInTheDocument();
  });

  it("renders the THWS logo link correctly", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Header />
      </MemoryRouter>,
    );

    const logo = screen.getByAltText("THWS Logo");
    expect(logo).toBeInTheDocument();
    expect(logo.closest("a")).toHaveAttribute("href", "/");
  });

  it("renders export, import, language, and theme toggle controls", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("header-transfer-export")).toBeInTheDocument();
    expect(screen.getByTestId("header-transfer-import")).toBeInTheDocument();
    expect(screen.getByTestId("language-select-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
  });
});

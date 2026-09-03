/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JavaConsolePanel } from "../../../../src/pages/Programming1/Java/components/Simulator/JavaConsolePanel";
import { createJavaExecutionSnapshot } from "../../../../src/pages/Programming1/Java/components/Simulator/domain/javaExecution";

const translations: Record<string, string> = {
  "java-programming.console.title": "Konsole",
  "java-programming.console.stdout": "Standardausgabe",
  "java-programming.console.stdoutEmpty": "Die Programmausgabe erscheint hier.",
  "java-programming.console.stderr": "Fehlerausgabe",
  "java-programming.console.stderrEmpty": "Laufzeitfehler erscheinen hier.",
  "java-programming.console.issues": "Diagnosen",
  "java-programming.console.noIssues": "Keine Diagnosen gemeldet.",
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      key: string,
      options?: { line?: number | string; column?: number | string },
    ) => {
      if (key === "java-programming.console.issueLocation") {
        return `Zeile ${options?.line}, Spalte ${options?.column}`;
      }

      return translations[key] ?? key;
    },
  }),
}));

describe("JavaConsolePanel", () => {
  it("renders all empty-state labels through the active translation", () => {
    render(<JavaConsolePanel snapshot={createJavaExecutionSnapshot()} />);

    expect(screen.getByText("Konsole")).toBeInTheDocument();
    expect(screen.getByText("Standardausgabe")).toBeInTheDocument();
    expect(screen.getByText("Fehlerausgabe")).toBeInTheDocument();
    expect(screen.getByText("Diagnosen")).toBeInTheDocument();
    expect(screen.getByText("Keine Diagnosen gemeldet.")).toBeInTheDocument();
    expect(screen.getByTestId("java-console-stdout")).toHaveTextContent(
      "Die Programmausgabe erscheint hier.",
    );
    expect(screen.getByTestId("java-console-stderr")).toHaveTextContent(
      "Laufzeitfehler erscheinen hier.",
    );
  });

  it("localizes diagnostic line and column labels", () => {
    render(
      <JavaConsolePanel
        snapshot={{
          ...createJavaExecutionSnapshot(),
          issues: [
            {
              code: "javac_diagnostic",
              stage: "javac",
              severity: "error",
              message: "';' expected",
              line: 4,
              column: 12,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Zeile 4, Spalte 12")).toBeInTheDocument();
  });
});

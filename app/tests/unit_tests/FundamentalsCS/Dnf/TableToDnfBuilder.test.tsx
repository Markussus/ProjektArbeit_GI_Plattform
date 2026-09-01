/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TableToDnfBuilder } from "../../../../src/pages/FundamentalsCS/Dnf/components/TableToDnfBuilder/TableToDnfBuilder";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

describe("TableToDnfBuilder", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders table builder setup preview and allows changing variable count or inverting table", () => {
    render(
      <TableToDnfBuilder
        storageIdentifier="test-table-dnf"
        storageEnabled={false}
        storageReady={true}
      />,
    );

    expect(screen.getByTestId("dnf-invert-table")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("dnf-invert-table"));
    expect(screen.getByTestId("dnf-commit-table")).toBeInTheDocument();
  });

  it("loads with committed initial value and renders workspace", () => {
    render(
      <TableToDnfBuilder
        storageIdentifier="test-table-dnf"
        storageEnabled={false}
        storageReady={true}
        initialValue={{
          variableCount: 2,
          resultValues: [true, false, true, false],
          committed: true,
          dnfAnswer: "a & !b",
          simplificationAnswer: "",
          truthTableAnswers: [],
        }}
        seedInitialFeedback={true}
      />,
    );

    expect(screen.getByTestId("dnf-exercise-workspace")).toBeInTheDocument();
    expect(screen.getByTestId("dnf-edit-table-config")).toBeInTheDocument();
  });
});

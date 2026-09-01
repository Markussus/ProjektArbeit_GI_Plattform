import { vi } from "vitest";

export interface MockSimulatorSharedOptions {
  includeModeToggle?: boolean;
}

export function mockSimulatorShared({
  includeModeToggle = false,
}: MockSimulatorSharedOptions = {}) {
  const mocks: Record<string, unknown> = {
    SimulatorLayout: ({
      inputPanel,
      resultPanel,
    }: {
      inputPanel: React.ReactNode;
      resultPanel: React.ReactNode;
    }) => (
      <div data-testid="mock-simulator-layout">
        <div data-testid="mock-input-panel">{inputPanel}</div>
        <div data-testid="mock-result-panel">{resultPanel}</div>
      </div>
    ),
    BinaryInput: ({
      value,
      onChange,
      locked,
      "data-testid": testId,
    }: {
      value: string;
      onChange: (v: string) => void;
      locked: boolean;
      "data-testid"?: string;
    }) => (
      <input
        data-testid={testId ?? "mock-binary-input"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={locked}
      />
    ),
    StepByStepToggle: ({
      onToggle,
    }: {
      open: boolean;
      onToggle: () => void;
    }) => (
      <button data-testid="mock-step-toggle" onClick={onToggle}>
        toggle
      </button>
    ),
    CollapsibleStep: ({
      header,
      children,
      isOpen,
    }: {
      header: React.ReactNode;
      children: React.ReactNode;
      isOpen: boolean;
    }) => (
      <div data-testid="mock-collapsible-step" data-open={isOpen}>
        <div data-testid="mock-step-header">{header}</div>
        {<div data-testid="mock-step-content">{children}</div>}
      </div>
    ),
    WarningBanner: ({
      title,
      children,
    }: {
      title: string;
      children: React.ReactNode;
    }) => (
      <div data-testid="mock-warning-banner">
        <span>{title}</span>
        <span>{children}</span>
      </div>
    ),
    ResultSectionHeader: ({ title }: { title: string }) => (
      <div data-testid="mock-result-header">{title}</div>
    ),
    useToggleSet: (initial: string[]) => ({
      expanded: new Set(initial),
      toggle: vi.fn(),
    }),
  };

  if (includeModeToggle) {
    mocks.ModeToggle = ({
      value,
      onChange,
      options,
      disabled,
    }: {
      value: string;
      onChange: (v: string) => void;
      options: { value: string; label: string }[];
      disabled?: boolean;
    }) => (
      <div>
        {options.map((option) => (
          <button
            key={option.value}
            data-testid={`mode-toggle-${option.value}`}
            data-active={value === option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  return mocks;
}

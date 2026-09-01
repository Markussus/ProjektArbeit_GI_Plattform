export function mockExerciseValidationPanelForConverters() {
  return {
    ExerciseValidationPanel: ({
      expectedResult,
      onShowSolution,
      inputMode,
    }: {
      expectedResult: string | string[];
      onShowSolution?: () => void;
      inputMode?: string;
    }) => (
      <div data-testid="mock-validation-panel">
        <span data-testid="mock-validation-expected-result">
          {Array.isArray(expectedResult)
            ? expectedResult.join(",")
            : expectedResult}
        </span>
        {inputMode && (
          <span data-testid="mock-validation-input-mode">{inputMode}</span>
        )}
        {onShowSolution && (
          <button
            data-testid="mock-validation-show-solution"
            onClick={onShowSolution}
          >
            show solution
          </button>
        )}
      </div>
    ),
  };
}

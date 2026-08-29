export function getTextInputWidth(value: string | undefined): string {
  return `${Math.max(7, (value ?? "").length + 3)}ch`;
}

export function getLongestValue(values: string[]): string {
  return values.reduce(
    (longest, value) => (value.length > longest.length ? value : longest),
    "",
  );
}

export function resizeTextInput(input: HTMLInputElement): void {
  input.style.width = "0px";
  input.style.width = `${Math.max(56, input.scrollWidth + 2)}px`;
}

export function resizeColumnTextInputs(
  input: HTMLInputElement,
  columnKey: string,
): void {
  const table = input.closest("table");
  if (!table) {
    resizeTextInput(input);
    return;
  }
  const columnInputs = Array.from(
    table.querySelectorAll<HTMLInputElement>(
      `input[data-output-column="${columnKey}"]`,
    ),
  );
  const maxWidth = Math.max(
    56,
    ...columnInputs.map((candidate) => {
      const previousWidth = candidate.style.width;
      candidate.style.width = "0px";
      const width = candidate.scrollWidth + 2;
      candidate.style.width = previousWidth;
      return width;
    }),
  );
  for (const candidate of columnInputs) {
    candidate.style.width = `${maxWidth}px`;
  }
}

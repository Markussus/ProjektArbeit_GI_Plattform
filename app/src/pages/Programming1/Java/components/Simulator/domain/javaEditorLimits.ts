export const JAVA_EDITOR_MAX_LINES = 10_000;
export const JAVA_EDITOR_MAX_CHARACTERS = 500_000;

export type JavaEditorLimitReason = "lines" | "characters";

export function getJavaEditorLimitReason(
  sourceCode: string,
): JavaEditorLimitReason | null {
  if (sourceCode.length > JAVA_EDITOR_MAX_CHARACTERS) {
    return "characters";
  }

  let lineCount = 1;
  for (let index = 0; index < sourceCode.length; index++) {
    if (sourceCode.charCodeAt(index) === 10) {
      lineCount++;
      if (lineCount > JAVA_EDITOR_MAX_LINES) {
        return "lines";
      }
    }
  }

  return null;
}

export function wouldPasteExceedJavaEditorLimit({
  currentCharacterCount,
  currentLineCount,
  selectedCharacterCount,
  selectedLineBreakCount,
  pastedText,
}: {
  currentCharacterCount: number;
  currentLineCount: number;
  selectedCharacterCount: number;
  selectedLineBreakCount: number;
  pastedText: string;
}): JavaEditorLimitReason | null {
  const nextCharacterCount =
    currentCharacterCount - selectedCharacterCount + pastedText.length;
  if (nextCharacterCount > JAVA_EDITOR_MAX_CHARACTERS) {
    return "characters";
  }

  const pastedLineBreakCount = countLineBreaks(pastedText);
  const nextLineCount =
    currentLineCount - selectedLineBreakCount + pastedLineBreakCount;

  return nextLineCount > JAVA_EDITOR_MAX_LINES ? "lines" : null;
}

function countLineBreaks(value: string): number {
  let count = 0;
  for (let index = 0; index < value.length; index++) {
    if (value.charCodeAt(index) === 10) {
      count++;
    }
  }
  return count;
}

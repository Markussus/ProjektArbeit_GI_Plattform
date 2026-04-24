import type { JavaExecutionIssue } from "./javaExecution";

export interface DisinfectJavaSourceResult {
  sanitizedSource: string;
  issues: JavaExecutionIssue[];
}

export function disinfectJavaSource(source: string): DisinfectJavaSourceResult {
  return {
    sanitizedSource: source,
    issues: [],
  };
}

import { createContext, useContext } from "react";
import type { useJavaExecution } from "./useJavaExecution";

export const JavaExecutionContext = createContext<ReturnType<
  typeof useJavaExecution
> | null>(null);

export function useJavaExecutionContext() {
  const context = useContext(JavaExecutionContext);

  if (!context) {
    throw new Error(
      "useJavaExecutionContext must be used within JavaExecutionProvider.",
    );
  }

  return context;
}

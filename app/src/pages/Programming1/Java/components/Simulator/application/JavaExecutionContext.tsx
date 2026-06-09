import type { PropsWithChildren } from "react";
import { JavaExecutionContext } from "./javaExecutionContextValue";
import { useJavaExecution } from "./useJavaExecution";

export function JavaExecutionProvider({ children }: PropsWithChildren) {
  const value = useJavaExecution();

  return (
    <JavaExecutionContext.Provider value={value}>
      {children}
    </JavaExecutionContext.Provider>
  );
}

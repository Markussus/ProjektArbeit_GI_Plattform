import {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";
import { useJavaExecution } from "./useJavaExecution";

const JavaExecutionContext = createContext<ReturnType<
  typeof useJavaExecution
> | null>(null);

export function JavaExecutionProvider({ children }: PropsWithChildren) {
  const value = useJavaExecution();

  return (
    <JavaExecutionContext.Provider value={value}>
      {children}
    </JavaExecutionContext.Provider>
  );
}

export function useJavaExecutionContext() {
  const context = useContext(JavaExecutionContext);

  if (!context) {
    throw new Error(
      "useJavaExecutionContext must be used within JavaExecutionProvider.",
    );
  }

  return context;
}

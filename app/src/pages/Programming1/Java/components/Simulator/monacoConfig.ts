import { loader } from "@monaco-editor/react";

export async function initMonacoOffline(): Promise<void> {
  if (typeof window === "undefined" || import.meta.env.TEST) {
    return;
  }

  const [monaco, { default: EditorWorker }] = await Promise.all([
    import("monaco-editor/editor/editor.api.js"),
    import("monaco-editor/editor/editor.worker.js?worker"),
  ]);

  await import("monaco-editor/languages/definitions/java/register.js");

  (
    window as unknown as {
      MonacoEnvironment?: {
        getWorker: (_: unknown, label: string) => Worker;
      };
    }
  ).MonacoEnvironment = {
    getWorker() {
      return new EditorWorker();
    },
  };

  loader.config({ monaco });
}

if (typeof window !== "undefined" && !import.meta.env.TEST) {
  void initMonacoOffline();
}

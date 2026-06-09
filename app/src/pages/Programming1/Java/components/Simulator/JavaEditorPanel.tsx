import { lazy, Suspense, useCallback, useEffect, useRef } from "react";
import type { OnMount } from "@monaco-editor/react";
import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SimulatorStringTransferBox } from "@/components/shared/SimulatorStringTransferBox";
import { useTheme } from "@/hooks/useTheme";
import type { JavaExecutionIssue } from "./domain/javaExecution";
import { javaCodeTransferCodec } from "./domain/javaCodeTransfer";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

export interface JavaEditorPanelProps {
  code: string;
  fileName: string;
  isFocused: boolean;
  onCodeChange: (nextCode: string) => void;
  onResetCode: () => void;
  onImportCode: (nextCode: string) => void;
  issues: JavaExecutionIssue[];
}

export function JavaEditorPanel({
  code,
  fileName,
  isFocused,
  onCodeChange,
  onResetCode,
  onImportCode,
  issues,
}: JavaEditorPanelProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const syncMarkers = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();

    if (!model || !monaco) {
      return;
    }

    monaco.editor.setModelMarkers(
      model,
      "java",
      issues
        .filter((issue) => issue.line)
        .map((issue) => ({
          startLineNumber: issue.line ?? 1,
          startColumn: issue.column ?? 1,
          endLineNumber: issue.line ?? 1,
          endColumn: Math.max((issue.column ?? 1) + 1, 2),
          message: issue.message,
          severity:
            issue.severity === "error"
              ? monaco.MarkerSeverity.Error
              : issue.severity === "warning"
                ? monaco.MarkerSeverity.Warning
                : monaco.MarkerSeverity.Info,
        })),
    );
  }, [issues]);
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    syncMarkers();
    editor.onDidChangeModel(syncMarkers);
  };

  useEffect(() => {
    syncMarkers();
  }, [syncMarkers]);

  return (
    <div data-testid="java-editor-panel" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs font-bold tracking-[0.18em] uppercase">
            {t("java.editorLabel")}
          </p>
          <p className="text-foreground mt-1 text-sm font-medium">{fileName}</p>
        </div>

        <button
          type="button"
          onClick={onResetCode}
          data-testid="java-reset-button"
          className="border-border text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
        >
          <RotateCcw className="size-4" />
          {t("java.resetStarterCode")}
        </button>
      </div>

      <div
        data-testid="java-editor-container"
        className="ring-foreground/10 overflow-hidden rounded-xl ring-1"
      >
        <Suspense
          fallback={
            <div className="bg-card text-muted-foreground flex h-[28rem] items-center justify-center p-4 text-sm">
              {t("java.editorLoading")}
            </div>
          }
        >
          <MonacoEditor
            height={isFocused ? "calc(100vh - 35rem)" : "28rem"}
            language="java"
            theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
            value={code}
            onChange={(nextValue) => onCodeChange(nextValue ?? "")}
            onMount={handleEditorMount}
            options={{
              automaticLayout: true,
              fontSize: 14,
              minimap: { enabled: false },
              padding: { top: 16, bottom: 16 },
              roundedSelection: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
              wordWrap: "on",
            }}
          />
        </Suspense>
      </div>

      <SimulatorStringTransferBox
        value={code}
        codec={javaCodeTransferCodec}
        onLoad={onImportCode}
        testIdPrefix="java-transfer"
      />
    </div>
  );
}

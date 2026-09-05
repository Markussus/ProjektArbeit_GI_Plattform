import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { OnMount } from "@monaco-editor/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import type { JavaExecutionIssue } from "./domain/javaExecution";
import {
  getJavaEditorLimitReason,
  JAVA_EDITOR_MAX_CHARACTERS,
  JAVA_EDITOR_MAX_LINES,
  type JavaEditorLimitReason,
} from "./domain/javaEditorLimits";
import {
  createPasteLimitListener,
  syncMonacoMarkers,
} from "./domain/javaEditorMarkers";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

export interface JavaEditorPanelProps {
  code: string;
  fileName: string;
  isFocused: boolean;
  onCodeChange: (nextCode: string) => void;
  issues: JavaExecutionIssue[];
}

export function JavaEditorPanel({
  code,
  fileName,
  isFocused,
  onCodeChange,
  issues,
}: JavaEditorPanelProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const [limitReason, setLimitReason] = useState<JavaEditorLimitReason | null>(
    null,
  );

  const syncActiveMarkers = useCallback(() => {
    syncMonacoMarkers(editorRef.current, monacoRef.current, issues);
  }, [issues]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    syncActiveMarkers();
    editor.onDidChangeModel(syncActiveMarkers);

    const editorNode = editor.getDomNode?.();

    const updateScrollOptions = (enabled: boolean) => {
      editor.updateOptions?.({
        scrollbar: {
          alwaysConsumeMouseWheel: false,
          handleMouseWheel: enabled,
        },
      });
    };

    // Scroll editor when mouse hovers over it, and pass wheel events to page when hitting top/bottom edges
    const isInitiallyHovered = Boolean(editorNode?.matches?.(":hover"));
    updateScrollOptions(isInitiallyHovered);

    const handleMouseEnter = () => {
      updateScrollOptions(true);
    };

    const handleMouseLeave = () => {
      updateScrollOptions(false);
    };

    editorNode?.addEventListener("mouseenter", handleMouseEnter);
    editorNode?.addEventListener("mouseleave", handleMouseLeave);

    const focusListener = editor.onDidFocusEditorWidget?.(() => {
      updateScrollOptions(true);
    });

    const blurListener = editor.onDidBlurEditorWidget?.(() => {
      if (!editorNode?.matches?.(":hover")) {
        updateScrollOptions(false);
      }
    });

    const pasteListener = createPasteLimitListener(editor, setLimitReason);
    editorNode?.addEventListener("paste", pasteListener, true);

    editor.onDidDispose?.(() => {
      editorNode?.removeEventListener("mouseenter", handleMouseEnter);
      editorNode?.removeEventListener("mouseleave", handleMouseLeave);
      editorNode?.removeEventListener("paste", pasteListener, true);
      focusListener?.dispose?.();
      blurListener?.dispose?.();
    });
  };

  useEffect(() => {
    syncActiveMarkers();
  }, [syncActiveMarkers]);

  const handleEditorCodeChange = useCallback(
    (nextCode: string) => {
      const reason = getJavaEditorLimitReason(nextCode);
      if (reason) {
        setLimitReason(reason);
        editorRef.current?.trigger("java-editor-limit", "undo", null);
        return;
      }

      setLimitReason(null);
      onCodeChange(nextCode);
    },
    [onCodeChange],
  );

  return (
    <div data-testid="java-editor-panel" className="space-y-4">
      <div className="pr-24">
        <div>
          <p className="text-muted-foreground text-xs font-bold tracking-[0.18em] uppercase">
            {t("java-programming.editorLabel")}
          </p>
          <p className="text-foreground mt-1 text-sm font-medium">{fileName}</p>
        </div>
      </div>

      <div
        data-testid="java-editor-container"
        className="ring-foreground/10 relative overflow-hidden overscroll-auto rounded-xl ring-1"
      >
        <Suspense
          fallback={
            <div className="bg-card text-muted-foreground flex h-[28rem] items-center justify-center p-4 text-sm">
              {t("java-programming.editorLoading")}
            </div>
          }
        >
          <MonacoEditor
            height={isFocused ? "calc(100vh - 35rem)" : "28rem"}
            language="java"
            theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
            value={code}
            onChange={(nextValue) => handleEditorCodeChange(nextValue ?? "")}
            onMount={handleEditorMount}
            options={{
              automaticLayout: true,
              fontSize: 14,
              minimap: { enabled: false },
              padding: { top: 16, bottom: 16 },
              roundedSelection: true,
              scrollBeyondLastLine: false,
              scrollbar: {
                alwaysConsumeMouseWheel: false,
                handleMouseWheel: false,
              },
              tabSize: 2,
              wordWrap: "on",
            }}
          />
        </Suspense>
      </div>

      {limitReason && (
        <p
          data-testid="java-editor-limit-warning"
          className="text-destructive text-sm"
        >
          {t(
            limitReason === "lines"
              ? "java-programming.editorLimit.lines"
              : "java-programming.editorLimit.characters",
            {
              maxLines: JAVA_EDITOR_MAX_LINES.toLocaleString(),
              maxCharacters: JAVA_EDITOR_MAX_CHARACTERS.toLocaleString(),
            },
          )}
        </p>
      )}
    </div>
  );
}

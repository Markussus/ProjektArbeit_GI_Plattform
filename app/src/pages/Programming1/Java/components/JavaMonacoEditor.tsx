import { lazy, Suspense, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import type { Exercise } from "@/types/exercise";
import { getJavaFileName, getJavaStarterCode } from "../exercises";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

interface JavaMonacoEditorProps {
  selectedExercise: Exercise | null;
  isFocused: boolean;
}

interface JavaEditorInstanceProps {
  exerciseId?: string;
  isFocused: boolean;
}

function JavaEditorInstance({
  exerciseId,
  isFocused,
}: JavaEditorInstanceProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [code, setCode] = useState(() => getJavaStarterCode(exerciseId));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs font-bold tracking-[0.18em] uppercase">
            {t("java.editorLabel")}
          </p>
          <p className="text-foreground mt-1 text-sm font-medium">
            {getJavaFileName(exerciseId)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCode(getJavaStarterCode(exerciseId))}
          className="border-border text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
        >
          <RotateCcw className="size-4" />
          {t("java.resetStarterCode")}
        </button>
      </div>

      <div className="ring-foreground/10 overflow-hidden rounded-xl ring-1">
        <Suspense
          fallback={
            <div className="bg-card text-muted-foreground flex h-[30rem] items-center justify-center p-4 text-sm">
              {t("java.editorLoading")}
            </div>
          }
        >
          <MonacoEditor
            height={isFocused ? "calc(100vh - 21rem)" : "30rem"}
            language="java"
            theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
            value={code}
            onChange={(nextValue) => setCode(nextValue ?? "")}
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
    </div>
  );
}

export function JavaMonacoEditor({
  selectedExercise,
  isFocused,
}: JavaMonacoEditorProps) {
  const exerciseId = selectedExercise?.id;

  return (
    <JavaEditorInstance
      key={exerciseId ?? "__default-java-editor__"}
      exerciseId={exerciseId}
      isFocused={isFocused}
    />
  );
}

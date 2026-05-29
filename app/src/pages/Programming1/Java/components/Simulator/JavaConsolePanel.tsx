import { TerminalSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JavaExecutionSnapshot } from "../Simulator/domain/javaExecution";

export interface JavaConsolePanelProps {
  snapshot: JavaExecutionSnapshot;
  className?: string;
}

export function JavaConsolePanel({
  snapshot,
  className,
}: JavaConsolePanelProps) {
  const stdout = snapshot.stdout.join("");
  const stderr = snapshot.stderr.join("");

  return (
    <div
      data-testid="java-console-panel"
      className={cn(
        "bg-card text-card-foreground rounded-xl border shadow-sm",
        className,
      )}
    >
      <div className="border-border flex items-center gap-2 border-b px-4 py-3">
        <TerminalSquare className="text-muted-foreground size-4" />
        <h3 className="text-sm font-semibold">Console</h3>
      </div>

      <div className="space-y-4 p-4">
        <ConsoleSection
          title="stdout"
          content={stdout}
          emptyText="Program output appears here."
          testId="java-console-stdout"
        />
        <ConsoleSection
          title="stderr"
          content={stderr}
          emptyText="Runtime errors appear here."
          tone="error"
          testId="java-console-stderr"
        />

        <div data-testid="java-console-issues" className="space-y-2">
          <h4 className="text-xs font-semibold tracking-wide uppercase">
            Issues
          </h4>
          {snapshot.issues.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No diagnostics reported.
            </p>
          ) : (
            <ul className="space-y-2">
              {snapshot.issues.map((issue, index) => (
                <li
                  key={`${issue.code}-${issue.line ?? "line"}-${index}`}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm",
                    issue.severity === "error"
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-border bg-background",
                  )}
                >
                  <p className="font-medium">
                    {issue.stage} / {issue.code}
                  </p>
                  <p className="text-muted-foreground">{issue.message}</p>
                  {issue.fileName && (
                    <p className="text-muted-foreground text-xs">
                      {issue.fileName}
                    </p>
                  )}
                  {(issue.line || issue.column) && (
                    <p className="text-muted-foreground text-xs">
                      Line {issue.line ?? "?"}, Column {issue.column ?? "?"}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

interface ConsoleSectionProps {
  title: string;
  content: string;
  emptyText: string;
  tone?: "default" | "error";
  testId: string;
}

function ConsoleSection({
  title,
  content,
  emptyText,
  tone = "default",
  testId,
}: ConsoleSectionProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold tracking-wide uppercase">{title}</h4>
      <pre
        data-testid={testId}
        className={cn(
          "min-h-24 overflow-x-auto rounded-lg border px-3 py-3 text-sm whitespace-pre-wrap",
          tone === "error"
            ? "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-200"
            : "border-border bg-background",
        )}
      >
        {content || emptyText}
      </pre>
    </div>
  );
}

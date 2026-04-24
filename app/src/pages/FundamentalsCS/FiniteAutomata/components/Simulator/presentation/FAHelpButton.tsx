import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating bottom-left help/guide button that opens an explanation panel
 * about the simulator, DFA vs NFA, and grammar conversion.
 */
export function FAHelpButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("fa.help.open", "Open guide")}
        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/40 fixed right-6 bottom-6 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-lg ring-2 ring-white/20 transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:outline-none"
        title={t("fa.help.title", "Guide")}
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 p-4 sm:items-center sm:justify-center"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={cn(
              "bg-card text-card-foreground flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="from-primary/10 flex items-center justify-between border-b bg-gradient-to-r to-transparent px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold">
                  {t("fa.help.title", "Finite Automata Guide")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("fa.help.close", "Close guide")}
                className="hover:bg-muted flex h-8 w-8 items-center justify-center rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto p-6 text-sm leading-relaxed">
              <Section
                title={t("fa.help.howToTitle", "How to use this simulator")}
              >
                <ol className="ml-5 list-decimal space-y-1.5">
                  <li>
                    {t(
                      "fa.help.howTo1",
                      "Choose between Manual Editor or From Grammar.",
                    )}
                  </li>
                  <li>
                    {t(
                      "fa.help.howTo2",
                      "Configure states, alphabet, start state and accept states.",
                    )}
                  </li>
                  <li>
                    {t(
                      "fa.help.howTo3",
                      "Fill the transition table (use comma-separated targets for NFAs).",
                    )}
                  </li>
                  <li>
                    {t(
                      "fa.help.howTo4",
                      "Enter an input word and click 'Start Simulation'.",
                    )}
                  </li>
                  <li>
                    {t(
                      "fa.help.howTo5",
                      "Use Play / Pause / Step controls to walk through the run.",
                    )}
                  </li>
                </ol>
              </Section>

              <Section
                title={t(
                  "fa.help.dfaTitle",
                  "DFA – Deterministic Finite Automaton",
                )}
              >
                <p>
                  {t(
                    "fa.help.dfaText",
                    "A DFA has exactly one transition per state and input symbol. There is exactly one active state at any time, and ε-transitions are not allowed.",
                  )}
                </p>
              </Section>

              <Section
                title={t(
                  "fa.help.nfaTitle",
                  "NFA – Nondeterministic Finite Automaton",
                )}
              >
                <p>
                  {t(
                    "fa.help.nfaText",
                    "An NFA may have multiple targets for the same input symbol and supports ε-transitions. The simulator tracks all reachable states in parallel and accepts a word if any of them is an accept state when the input ends.",
                  )}
                </p>
              </Section>

              <Section
                title={t("fa.help.grammarTitle", "Regular Grammar → Automaton")}
              >
                <p className="mb-2">
                  {t(
                    "fa.help.grammarText",
                    "A right-linear regular grammar is converted into an NFA as follows:",
                  )}
                </p>
                <ul className="ml-5 list-disc space-y-1">
                  <li>
                    <code className="bg-muted rounded px-1 py-0.5">A → aB</code>{" "}
                    {t(
                      "fa.help.grammarRule1",
                      "becomes a transition A → B on symbol a.",
                    )}
                  </li>
                  <li>
                    <code className="bg-muted rounded px-1 py-0.5">A → a</code>{" "}
                    {t(
                      "fa.help.grammarRule2",
                      "becomes a transition A → qF (final accept state) on symbol a.",
                    )}
                  </li>
                  <li>
                    {t(
                      "fa.help.grammarRule3",
                      "Non-terminals become states, terminals become alphabet symbols.",
                    )}
                  </li>
                </ul>
              </Section>

              <Section title={t("fa.help.legendTitle", "Diagram Legend")}>
                <ul className="ml-5 list-disc space-y-1">
                  <li>
                    <span className="font-semibold">
                      {t("fa.help.legendStart", "Start state")}:{" "}
                    </span>
                    {t(
                      "fa.help.legendStartText",
                      "marked with an incoming arrow labeled 'start'.",
                    )}
                  </li>
                  <li>
                    <span className="font-semibold">
                      {t("fa.help.legendAccept", "Accept state")}:{" "}
                    </span>
                    {t(
                      "fa.help.legendAcceptText",
                      "drawn with a double circle.",
                    )}
                  </li>
                  <li>
                    <span className="font-semibold">
                      {t("fa.help.legendActive", "Active state")}:{" "}
                    </span>
                    {t(
                      "fa.help.legendActiveText",
                      "highlighted in primary color during execution.",
                    )}
                  </li>
                </ul>
              </Section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-foreground mb-2 text-sm font-bold tracking-wide uppercase">
        {title}
      </h3>
      <div className="text-muted-foreground space-y-2 text-sm">{children}</div>
    </section>
  );
}

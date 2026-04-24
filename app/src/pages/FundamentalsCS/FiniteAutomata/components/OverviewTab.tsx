import { useTranslation } from "react-i18next";
import {
  Network,
  Workflow,
  GitBranch,
  Sparkles,
  ListChecks,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const conceptIcons = [Network, Workflow, GitBranch, Sparkles];

function getConceptAccentClasses() {
  return "bg-module-blue-bg text-module-blue-fg";
}

export function OverviewTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Main intro card */}
      <div className="bg-card ring-foreground/10 from-primary/5 relative overflow-hidden rounded-xl bg-gradient-to-br to-transparent p-6 ring-1">
        <div className="bg-primary/10 absolute -top-12 -right-12 h-40 w-40 rounded-full blur-3xl" />
        <h3 className="text-foreground relative text-lg font-semibold">
          {t("automata.overviewTitle")}
        </h3>
        <p className="text-muted-foreground relative mt-3 text-sm leading-relaxed">
          {t("automata.overviewText")}
        </p>
      </div>

      {/* Concepts */}
      <div>
        <h3 className="text-muted-foreground mb-3 text-sm font-bold tracking-wider uppercase">
          {t("automata.concepts")}
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          {([1, 2, 3, 4] as const).map((num, i) => {
            const Icon = conceptIcons[i];

            return (
              <div
                key={num}
                className="bg-card ring-foreground/10 hover:ring-primary/40 flex items-center gap-3 rounded-lg p-4 ring-1 transition-all hover:shadow-md"
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-md",
                    getConceptAccentClasses(),
                  )}
                >
                  <Icon className="size-4" />
                </div>

                <span className="text-foreground text-sm font-medium">
                  {t(`automata.concept${num}`)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DFA vs NFA comparison */}
      <div>
        <h3 className="text-muted-foreground mb-3 text-sm font-bold tracking-wider uppercase">
          {t("automata.comparison", "DFA vs. NFA")}
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <ComparisonCard
            title="DFA"
            subtitle={t(
              "automata.dfaSubtitle",
              "Deterministic Finite Automaton",
            )}
            items={[
              t(
                "automata.dfaPoint1",
                "Exactly one transition per (state, symbol)",
              ),
              t("automata.dfaPoint2", "Exactly one active state at any time"),
              t("automata.dfaPoint3", "No ε-transitions"),
              t("automata.dfaPoint4", "Easy to simulate efficiently"),
            ]}
          />
          <ComparisonCard
            title="NFA"
            subtitle={t(
              "automata.nfaSubtitle",
              "Nondeterministic Finite Automaton",
            )}
            items={[
              t("automata.nfaPoint1", "Multiple targets per (state, symbol)"),
              t(
                "automata.nfaPoint2",
                "Set of active states explored in parallel",
              ),
              t("automata.nfaPoint3", "Supports ε-transitions"),
              t("automata.nfaPoint4", "Equivalent to DFA in expressive power"),
            ]}
          />
        </div>
      </div>

      {/* What you can do */}
      <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
        <h3 className="text-foreground mb-3 flex items-center gap-2 text-base font-semibold">
          <ListChecks className="text-primary size-5" />
          {t("automata.whatYouCanDo", "What you can do here")}
        </h3>
        <ul className="space-y-2">
          {[
            t(
              "automata.feature1",
              "Build DFAs and NFAs visually using a transition table",
            ),
            t(
              "automata.feature2",
              "Convert a right-linear regular grammar into an automaton",
            ),
            t(
              "automata.feature3",
              "Test input words with step-by-step execution",
            ),
            t(
              "automata.feature4",
              "Watch the state diagram animate as the simulation runs",
            ),
          ].map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ComparisonCard(props: ComparisonCardProps) {
  const { title, subtitle, items } = props;
  return (
    <div className="bg-card ring-foreground/10 rounded-lg p-4 ring-1">
      <div className="mb-3">
        <h4 className="text-foreground text-base font-bold">{title}</h4>
        <p className="text-muted-foreground text-xs">{subtitle}</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="text-muted-foreground flex items-start gap-2 text-xs"
          >
            <span className="bg-primary/60 mt-1.5 size-1.5 shrink-0 rounded-full" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ComparisonCardProps {
  title: string;
  subtitle: string;
  items: string[];
}

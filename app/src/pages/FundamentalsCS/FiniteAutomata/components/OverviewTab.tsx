import { useTranslation } from "react-i18next";
import {
  ListChecks,
  CheckCircle2,
  Network,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface ConceptItem {
  icon: LucideIcon;
  titleKey: string;
  titleFallback: string;
  descKey: string;
  descFallback: string;
}

const concepts: ConceptItem[] = [
  {
    icon: Network,
    titleKey: "automata.concept1",
    titleFallback: "DFA & NFA",
    descKey: "automata.concept1Desc",
    descFallback:
      "Build either type — the editor flags non-determinism in your transition table.",
  },
  {
    icon: Sparkles,
    titleKey: "automata.concept2",
    titleFallback: "Grammar → Automaton",
    descKey: "automata.concept2Desc",
    descFallback:
      "Paste a right-linear regular grammar and convert it to an NFA in one click.",
  },
];

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

      {/* Key Concepts — each one maps to a simulator feature */}
      <div>
        <h3 className="text-muted-foreground mb-3 text-sm font-bold tracking-wider uppercase">
          {t("automata.concepts", "Key Concepts")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {concepts.map(
            ({
              icon: Icon,
              titleKey,
              titleFallback,
              descKey,
              descFallback,
            }) => (
              <div
                key={titleKey}
                className="bg-card ring-foreground/10 flex items-start gap-3 rounded-lg p-4 ring-1"
              >
                <Icon className="text-primary mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    {t(titleKey, titleFallback)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs leading-snug">
                    {t(descKey, descFallback)}
                  </p>
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* What you can do — strictly the features the simulator supports */}
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
              "Step through an input word and watch the state diagram update",
            ),
            t(
              "automata.feature4",
              "Batch-test multiple words and inspect accept/reject results",
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

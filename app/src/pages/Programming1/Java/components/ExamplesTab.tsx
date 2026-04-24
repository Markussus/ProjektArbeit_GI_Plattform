import { BookOpen, Code2, Repeat } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { TranslationKey } from "@/types/i18n";

interface ExampleCardDefinition {
  icon: typeof BookOpen;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  code: string;
}

const exampleCards: ExampleCardDefinition[] = [
  {
    icon: BookOpen,
    titleKey: "java.example1Title",
    descriptionKey: "java.example1Text",
    code: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello World");
  }
}`,
  },
  {
    icon: Repeat,
    titleKey: "java.example2Title",
    descriptionKey: "java.example2Text",
    code: `for (int i = 0; i < 5; i++) {
  System.out.println("Hello World");
}`,
  },
  {
    icon: Code2,
    titleKey: "java.example3Title",
    descriptionKey: "java.example3Text",
    code: `int[] numbers = {5, 2, 9, 1, 4};
Arrays.sort(numbers);
System.out.println(Arrays.toString(numbers));`,
  },
];

export function ExamplesTab() {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {exampleCards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.titleKey}
            className="bg-card ring-foreground/10 rounded-xl p-6 ring-1"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-module-orange-bg text-module-orange-fg flex size-10 items-center justify-center rounded-lg">
                <Icon className="size-5" />
              </div>
              <h3 className="text-foreground text-base font-semibold">
                {t(card.titleKey)}
              </h3>
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed">
              {t(card.descriptionKey)}
            </p>

            <pre className="bg-muted mt-4 overflow-x-auto rounded-lg p-4 text-xs leading-relaxed">
              <code>{card.code}</code>
            </pre>
          </article>
        );
      })}
    </div>
  );
}

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { normalizeSupportedLanguage } from "./languages";

// Common translation modules loaded eagerly for instant initial render (Header, Home, Footer, etc.)
import enCommon from "./locales/en/common.json";
import deCommon from "./locales/de/common.json";

const loadedLanguages = new Set<string>();

export async function loadTopicTranslations(language?: string): Promise<void> {
  const norm = normalizeSupportedLanguage(
    language ?? i18n.resolvedLanguage ?? i18n.language,
  );
  if (loadedLanguages.has(norm)) return;
  loadedLanguages.add(norm);

  if (norm === "de") {
    const [
      finiteAutomata,
      numberSystems,
      encoding,
      mooreMealy,
      dnf,
      javaProgramming,
      turingMachine,
      regularLanguages,
    ] = await Promise.all([
      import("./locales/de/finite-automata.json"),
      import("./locales/de/number-systems.json"),
      import("./locales/de/encoding.json"),
      import("./locales/de/moore-mealy.json"),
      import("./locales/de/dnf.json"),
      import("./locales/de/java-programming.json"),
      import("./locales/de/turing-machine.json"),
      import("./locales/de/regular-languages.json"),
    ]);

    i18n.addResourceBundle(
      "de",
      "translation",
      {
        "finite-automata": finiteAutomata.default,
        "number-systems": numberSystems.default,
        encoding: encoding.default,
        "moore-mealy": mooreMealy.default,
        dnf: dnf.default,
        "java-programming": javaProgramming.default,
        "turing-machine": turingMachine.default,
        "regular-languages": regularLanguages.default,
      },
      true,
      true,
    );
  } else {
    const [
      finiteAutomata,
      numberSystems,
      encoding,
      mooreMealy,
      dnf,
      javaProgramming,
      turingMachine,
      regularLanguages,
    ] = await Promise.all([
      import("./locales/en/finite-automata.json"),
      import("./locales/en/number-systems.json"),
      import("./locales/en/encoding.json"),
      import("./locales/en/moore-mealy.json"),
      import("./locales/en/dnf.json"),
      import("./locales/en/java-programming.json"),
      import("./locales/en/turing-machine.json"),
      import("./locales/en/regular-languages.json"),
    ]);

    i18n.addResourceBundle(
      "en",
      "translation",
      {
        "finite-automata": finiteAutomata.default,
        "number-systems": numberSystems.default,
        encoding: encoding.default,
        "moore-mealy": mooreMealy.default,
        dnf: dnf.default,
        "java-programming": javaProgramming.default,
        "turing-machine": turingMachine.default,
        "regular-languages": regularLanguages.default,
      },
      true,
      true,
    );
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: { common: enCommon } },
      de: { translation: { common: deCommon } },
    },
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
    interpolation: {
      escapeValue: false,
    },
  });

// Load topic translations for initial language immediately in background
void loadTopicTranslations();

// Load topic translations whenever language is changed
i18n.on("languageChanged", (lng) => {
  void loadTopicTranslations(lng);
});

export default i18n;

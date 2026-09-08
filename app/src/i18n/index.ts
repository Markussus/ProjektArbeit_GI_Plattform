import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { DEFAULT_LANGUAGE } from "./languages";

// English split translation modules
import enCommon from "./locales/en/common.json";
import enFiniteAutomata from "./locales/en/finite-automata.json";
import enNumberSystems from "./locales/en/number-systems.json";
import enEncoding from "./locales/en/encoding.json";
import enMooreMealy from "./locales/en/moore-mealy.json";
import enDnf from "./locales/en/dnf.json";
import enJavaProgramming from "./locales/en/java-programming.json";
import enTuringMachine from "./locales/en/turing-machine.json";
import enRegularLanguages from "./locales/en/regular-languages.json";

// German split translation modules
import deCommon from "./locales/de/common.json";
import deFiniteAutomata from "./locales/de/finite-automata.json";
import deNumberSystems from "./locales/de/number-systems.json";
import deEncoding from "./locales/de/encoding.json";
import deMooreMealy from "./locales/de/moore-mealy.json";
import deDnf from "./locales/de/dnf.json";
import deJavaProgramming from "./locales/de/java-programming.json";
import deTuringMachine from "./locales/de/turing-machine.json";
import deRegularLanguages from "./locales/de/regular-languages.json";

// Turkish split translation modules
import trCommon from "./locales/tr/common.json";
import trFiniteAutomata from "./locales/tr/finite-automata.json";
import trNumberSystems from "./locales/tr/number-systems.json";
import trEncoding from "./locales/tr/encoding.json";
import trMooreMealy from "./locales/tr/moore-mealy.json";
import trDnf from "./locales/tr/dnf.json";
import trJavaProgramming from "./locales/tr/java-programming.json";
import trTuringMachine from "./locales/tr/turing-machine.json";
import trRegularLanguages from "./locales/tr/regular-languages.json";

// Ukrainian split translation modules
import ukCommon from "./locales/uk/common.json";
import ukFiniteAutomata from "./locales/uk/finite-automata.json";
import ukNumberSystems from "./locales/uk/number-systems.json";
import ukEncoding from "./locales/uk/encoding.json";
import ukMooreMealy from "./locales/uk/moore-mealy.json";
import ukDnf from "./locales/uk/dnf.json";
import ukJavaProgramming from "./locales/uk/java-programming.json";
import ukTuringMachine from "./locales/uk/turing-machine.json";
import ukRegularLanguages from "./locales/uk/regular-languages.json";

const en = {
  common: enCommon,
  "finite-automata": enFiniteAutomata,
  "number-systems": enNumberSystems,
  encoding: enEncoding,
  "moore-mealy": enMooreMealy,
  dnf: enDnf,
  "java-programming": enJavaProgramming,
  "turing-machine": enTuringMachine,
  "regular-languages": enRegularLanguages,
};

const de = {
  common: deCommon,
  "finite-automata": deFiniteAutomata,
  "number-systems": deNumberSystems,
  encoding: deEncoding,
  "moore-mealy": deMooreMealy,
  dnf: deDnf,
  "java-programming": deJavaProgramming,
  "turing-machine": deTuringMachine,
  "regular-languages": deRegularLanguages,
};

const tr = {
  common: trCommon,
  "finite-automata": trFiniteAutomata,
  "number-systems": trNumberSystems,
  encoding: trEncoding,
  "moore-mealy": trMooreMealy,
  dnf: trDnf,
  "java-programming": trJavaProgramming,
  "turing-machine": trTuringMachine,
  "regular-languages": trRegularLanguages,
};

const uk = {
  common: ukCommon,
  "finite-automata": ukFiniteAutomata,
  "number-systems": ukNumberSystems,
  encoding: ukEncoding,
  "moore-mealy": ukMooreMealy,
  dnf: ukDnf,
  "java-programming": ukJavaProgramming,
  "turing-machine": ukTuringMachine,
  "regular-languages": ukRegularLanguages,
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      tr: { translation: tr },
      uk: { translation: uk },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: "translation",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on("languageChanged", (lng) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng;
  }
});

if (typeof document !== "undefined" && i18n.resolvedLanguage) {
  document.documentElement.lang = i18n.resolvedLanguage;
}

export default i18n;

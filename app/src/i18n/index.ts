import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

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

const en = {
    "common": enCommon,
    "finite-automata": enFiniteAutomata,
    "number-systems": enNumberSystems,
    "encoding": enEncoding,
    "moore-mealy": enMooreMealy,
    "dnf": enDnf,
    "java-programming": enJavaProgramming,
    "turing-machine": enTuringMachine,
    "regular-languages": enRegularLanguages,
};

const de = {
    "common": deCommon,
    "finite-automata": deFiniteAutomata,
    "number-systems": deNumberSystems,
    "encoding": deEncoding,
    "moore-mealy": deMooreMealy,
    "dnf": deDnf,
    "java-programming": deJavaProgramming,
    "turing-machine": deTuringMachine,
    "regular-languages": deRegularLanguages,
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
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

export default i18n;

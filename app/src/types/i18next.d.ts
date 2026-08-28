import "i18next";

import enCommon from "@/i18n/locales/en/common.json";
import enFiniteAutomata from "@/i18n/locales/en/finite-automata.json";
import enNumberSystems from "@/i18n/locales/en/number-systems.json";
import enEncoding from "@/i18n/locales/en/encoding.json";
import enMooreMealy from "@/i18n/locales/en/moore-mealy.json";
import enDnf from "@/i18n/locales/en/dnf.json";
import enJavaProgramming from "@/i18n/locales/en/java-programming.json";
import enTuringMachine from "@/i18n/locales/en/turing-machine.json";
import enRegularLanguages from "@/i18n/locales/en/regular-languages.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: {
        common: typeof enCommon;
        "finite-automata": typeof enFiniteAutomata;
        "number-systems": typeof enNumberSystems;
        encoding: typeof enEncoding;
        "moore-mealy": typeof enMooreMealy;
        dnf: typeof enDnf;
        "java-programming": typeof enJavaProgramming;
        "turing-machine": typeof enTuringMachine;
        "regular-languages": typeof enRegularLanguages;
      };
    };
  }
}

import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DropdownSelect } from "@/components/shared/DropdownSelect/DropdownSelect";
import {
  normalizeSupportedLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from "@/i18n/languages";
import type { TranslationKey } from "@/types/i18n";

const languageLabels: Record<SupportedLanguage, string> = {
  de: "DE",
  en: "EN",
};

const languageTranslationKeys: Record<SupportedLanguage, TranslationKey> = {
  de: "language.de",
  en: "language.en",
};

export function LanguageSelect() {
  const { i18n, t } = useTranslation();

  const currentLanguage = normalizeSupportedLanguage(
    i18n.resolvedLanguage ?? i18n.language,
  );
  const options = supportedLanguages.map((language) => ({
    value: language,
    triggerLabel: (
      <span className="text-xs font-semibold tracking-wide uppercase">
        {languageLabels[language]}
      </span>
    ),
    label: (
      <span className="font-semibold uppercase">
        {languageLabels[language]}
      </span>
    ),
    description: t(languageTranslationKeys[language]),
  }));

  return (
    <DropdownSelect
      value={currentLanguage}
      options={options}
      onChange={(language) => {
        void i18n.changeLanguage(language);
      }}
      ariaLabel={t("language.select")}
      triggerIcon={<Globe className="text-muted-foreground size-4 shrink-0" />}
      triggerClassName="h-8 gap-2 px-2.5"
      menuClassName="right-0 min-w-32"
      optionClassName="text-sm"
      triggerTestId="language-select-trigger"
      menuTestId="language-select-menu"
      optionTestIdPrefix="language-select-option"
    />
  );
}

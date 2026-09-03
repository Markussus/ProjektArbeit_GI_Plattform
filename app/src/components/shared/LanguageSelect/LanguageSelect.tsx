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
  de: "common.language.de",
  en: "common.language.en",
};

export function LanguageSelect() {
  const { i18n, t } = useTranslation();

  const currentLanguage = normalizeSupportedLanguage(
    i18n.resolvedLanguage ?? i18n.language,
  );
  const options = supportedLanguages.map((language) => ({
    value: language,
    triggerLabel: (
      <span className="hidden text-xs font-semibold tracking-wide uppercase lg:inline">
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
      ariaLabel={t("common.language.select")}
      triggerIcon={<Globe className="text-muted-foreground size-4 shrink-0" />}
      triggerClassName="size-8 sm:size-9 justify-center gap-0 px-0 shrink-0 lg:w-auto lg:gap-2 lg:px-2.5"
      chevronClassName="hidden lg:block"
      menuClassName="right-0 min-w-32"
      optionClassName="text-sm"
      triggerTestId="language-select-trigger"
      menuTestId="language-select-menu"
      optionTestIdPrefix="language-select-option"
    />
  );
}

export const supportedLanguages = ["de", "en", "tr", "uk"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "de";

export function normalizeSupportedLanguage(
  language: string | undefined,
): SupportedLanguage {
  const match = supportedLanguages.find((code) => language?.startsWith(code));

  return match ?? DEFAULT_LANGUAGE;
}

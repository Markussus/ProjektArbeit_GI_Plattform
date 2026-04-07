export const supportedLanguages = ["de", "en"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export function normalizeSupportedLanguage(
  language: string | undefined,
): SupportedLanguage {
  const match = supportedLanguages.find((code) => language?.startsWith(code));

  return match ?? "en";
}

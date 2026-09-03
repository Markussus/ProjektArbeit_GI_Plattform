import { describe, expect, it } from "vitest";
import i18n from "@/i18n";
import {
  DEFAULT_LANGUAGE,
  normalizeSupportedLanguage,
  supportedLanguages,
} from "@/i18n/languages";
import { learningModules } from "@/data/moduleCatalogData";

describe("i18n configuration and translations", () => {
  it("has fallback default language set to de", () => {
    expect(DEFAULT_LANGUAGE).toBe("de");
    expect(supportedLanguages).toContain("de");
    expect(supportedLanguages).toContain("en");
  });

  it("normalizes unknown browser languages to the de fallback", () => {
    expect(normalizeSupportedLanguage("fr")).toBe("de");
    expect(normalizeSupportedLanguage("es-ES")).toBe("de");
    expect(normalizeSupportedLanguage(undefined)).toBe("de");
    expect(normalizeSupportedLanguage("de-DE")).toBe("de");
    expect(normalizeSupportedLanguage("en-US")).toBe("en");
  });

  it("has all topic keys immediately available in German", async () => {
    await i18n.changeLanguage("de");
    expect(i18n.language).toBe("de");

    for (const module of learningModules) {
      expect(i18n.t(module.titleKey)).not.toBe(module.titleKey);
      expect(i18n.t(module.descriptionKey)).not.toBe(module.descriptionKey);

      for (const topic of module.topics) {
        const translatedTitle = i18n.t(topic.titleKey);
        expect(translatedTitle).not.toBe(topic.titleKey);
        expect(translatedTitle.length).toBeGreaterThan(0);

        if (topic.descriptionKey) {
          const translatedDesc = i18n.t(topic.descriptionKey);
          expect(translatedDesc).not.toBe(topic.descriptionKey);
          expect(translatedDesc.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("has all topic keys immediately available in English after language switch", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.language).toBe("en");

    for (const module of learningModules) {
      expect(i18n.t(module.titleKey)).not.toBe(module.titleKey);
      expect(i18n.t(module.descriptionKey)).not.toBe(module.descriptionKey);

      for (const topic of module.topics) {
        const translatedTitle = i18n.t(topic.titleKey);
        expect(translatedTitle).not.toBe(topic.titleKey);
        expect(translatedTitle.length).toBeGreaterThan(0);

        if (topic.descriptionKey) {
          const translatedDesc = i18n.t(topic.descriptionKey);
          expect(translatedDesc).not.toBe(topic.descriptionKey);
          expect(translatedDesc.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("falls back to German when an unsupported language is requested", async () => {
    await i18n.changeLanguage("fr");
    // fallbackLng is 'de', so German strings should be resolved
    const title = i18n.t("turing-machine.topic.title");
    expect(title).toBe("Turingmaschinen");
  });

  it("produces distinct translations between German and English for topics", async () => {
    await i18n.changeLanguage("de");
    const deTitle = i18n.t("turing-machine.topic.title");

    await i18n.changeLanguage("en");
    const enTitle = i18n.t("turing-machine.topic.title");

    expect(deTitle).toBe("Turingmaschinen");
    expect(enTitle).toBe("Turing Machines");
  });
});

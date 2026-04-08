import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  normalizeSupportedLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from "@/i18n/languages";

const languageLabels: Record<SupportedLanguage, string> = {
  de: "DE",
  en: "EN",
};

export function LanguageSelect() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentLanguage = normalizeSupportedLanguage(
    i18n.resolvedLanguage ?? i18n.language,
  );

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSelect = (language: SupportedLanguage) => {
    setIsOpen(false);
    void i18n.changeLanguage(language);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t("language.select")}
        className={cn(
          "border-border bg-background text-foreground hover:bg-muted/60 focus-visible:ring-ring inline-flex h-8 items-center gap-2 rounded-md border px-2.5 focus-visible:ring-2 focus-visible:outline-none",
          isOpen && "bg-muted/70",
        )}
      >
        <Globe className="text-muted-foreground size-4 shrink-0" />
        <span className="text-xs font-semibold tracking-wide uppercase">
          {languageLabels[currentLanguage]}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-3 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t("language.select")}
          className="bg-popover text-popover-foreground border-border absolute top-[calc(100%+0.5rem)] right-0 z-30 min-w-32 overflow-hidden rounded-xl border p-1 shadow-lg"
        >
          {supportedLanguages.map((language) => {
            const isActive = language === currentLanguage;

            return (
              <button
                key={language}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(language)}
                className={cn(
                  "hover:bg-muted focus-visible:ring-ring flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm focus-visible:ring-2 focus-visible:outline-none",
                  isActive && "bg-muted",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold uppercase">
                    {languageLabels[language]}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {t(`language.${language}` as never)}
                  </span>
                </div>

                {isActive && <Check className="text-brand size-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

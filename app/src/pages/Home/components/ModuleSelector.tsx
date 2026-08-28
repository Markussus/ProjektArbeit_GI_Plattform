import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Layers3, Sparkles } from "lucide-react";
import { learningModules } from "@/data/moduleCatalog";
import { cn } from "@/lib/utils";

export function ModuleSelector() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <p className="text-muted-foreground mb-3 text-center text-xs font-bold tracking-[0.2em] uppercase">
        {t("common.home.selectModule")}
      </p>

      <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          data-testid="module-selector-trigger"
          className="hover:bg-muted/40 flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <Layers3 className="text-muted-foreground size-4" />
            <span className="text-foreground text-base font-semibold">
              {t("common.home.exploreModules")}
            </span>
          </div>

          <ChevronDown
            className={cn(
              "text-muted-foreground size-4 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {isOpen && (
        <div
          data-testid="module-selector-menu"
          className="bg-card ring-foreground/10 absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-xl shadow-lg ring-1"
        >
          <div className="max-h-[min(60vh,24rem)] overflow-y-auto">
            <div className="divide-border divide-y">
              {learningModules.map((module) => (
                <Link
                  key={module.id}
                  to={module.path}
                  data-testid={`module-selector-link-${module.id}`}
                  data-module-id={module.id}
                  data-module-path={module.path}
                  className="hover:bg-muted/40 flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <p className="text-foreground text-base font-semibold">
                      {t(module.titleKey)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {t(module.descriptionKey)}
                    </p>
                  </div>

                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                </Link>
              ))}

              <div className="flex items-center gap-3 px-5 py-4">
                <Sparkles className="text-muted-foreground size-4" />
                <div>
                  <p className="text-foreground text-base font-semibold">
                    {t("common.modules.moreComingSoon")}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {t("common.modules.moreComingSoonDescription")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Layers3, Sparkles } from "lucide-react";
import { learningModules } from "@/data/modules";
import { cn } from "@/lib/utils";

export function ModuleSelector() {
  const { t } = useTranslation();
  const tk = (key: string) => t(key as never);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <p className="mb-3 text-center text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
        {t("home.selectModule")}
      </p>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <Layers3 className="size-4 text-muted-foreground" />
            <span className="text-base font-semibold text-foreground">
              {t("home.exploreModules")}
            </span>
          </div>

          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-xl bg-card shadow-lg ring-1 ring-foreground/10">
          <div className="max-h-[min(60vh,24rem)] overflow-y-auto">
            <div className="divide-y divide-border">
              {learningModules.map((module) => (
                <Link
                  key={module.id}
                  to={module.path}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/40"
                >
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {tk(module.titleKey)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tk(module.descriptionKey)}
                    </p>
                  </div>

                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}

              <div className="flex items-center gap-3 px-5 py-4">
                <Sparkles className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {t("modules.moreComingSoon")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("modules.moreComingSoonDescription")}
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

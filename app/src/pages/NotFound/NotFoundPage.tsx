import { Skull, ArrowLeft, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function NotFoundPage() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-4xl">
        <div className="bg-card ring-foreground/10 rounded-2xl p-8 shadow-sm ring-1 md:p-12">
          <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="flex items-center gap-4 md:gap-6">
                <span className="text-foreground text-7xl font-black tracking-tight md:text-9xl">
                  4
                </span>

                <div className="border-brand relative flex size-24 items-center justify-center rounded-full border-4 md:size-32">
                  <Skull className="text-brand size-10 md:size-14" />
                </div>

                <span className="text-foreground text-7xl font-black tracking-tight md:text-9xl">
                  4
                </span>
              </div>

              <h1
                data-testid="not-found-title"
                className="text-foreground mt-8 text-3xl font-bold tracking-tight md:text-5xl"
              >
                {t("common.notFound.title")}
              </h1>

              <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed md:text-lg">
                {t("common.notFound.description")}
              </p>

              <p className="text-muted-foreground mt-3 text-sm">
                {t("common.notFound.requestedUrl")}:{" "}
                <span
                  data-testid="not-found-requested-path"
                  className="text-foreground font-medium"
                >
                  {location.pathname}
                </span>
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold hover:opacity-90"
                >
                  <Home className="size-4" />
                  {t("common.notFound.goHome")}
                </Link>

                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="border-border text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold"
                >
                  <ArrowLeft className="size-4" />
                  {t("common.notFound.goBack")}
                </button>
              </div>
            </div>

            <div className="bg-muted ring-foreground/10 rounded-xl p-6 ring-1">
              <p className="text-muted-foreground text-xs font-bold tracking-[0.18em] uppercase">
                {t("common.notFound.hintLabel")}
              </p>

              <ul className="text-muted-foreground mt-4 space-y-3 text-sm leading-relaxed">
                <li>{t("common.notFound.reason1")}</li>
                <li>{t("common.notFound.reason2")}</li>
                <li>{t("common.notFound.reason3")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

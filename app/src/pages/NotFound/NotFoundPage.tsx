import { Skull, ArrowLeft, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function NotFoundPage() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-4xl">
        <div className="rounded-2xl bg-card p-8 shadow-sm ring-1 ring-foreground/10 md:p-12">
          <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="flex items-center gap-4 md:gap-6">
                <span className="text-7xl font-black tracking-tight text-foreground md:text-9xl">
                  4
                </span>

                <div className="relative flex size-24 items-center justify-center rounded-full border-4 border-brand md:size-32">
                  <Skull className="size-10 text-brand md:size-14" />
                </div>

                <span className="text-7xl font-black tracking-tight text-foreground md:text-9xl">
                  4
                </span>
              </div>

              <h1 className="mt-8 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                {t("notFound.title")}
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {t("notFound.description")}
              </p>

              <p className="mt-3 text-sm text-muted-foreground">
                {t("notFound.requestedUrl")}:{" "}
                <span className="font-medium text-foreground">
                  {location.pathname}
                </span>
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:opacity-90"
                >
                  <Home className="size-4" />
                  {t("notFound.goHome")}
                </Link>

                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  <ArrowLeft className="size-4" />
                  {t("notFound.goBack")}
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-muted p-6 ring-1 ring-foreground/10">
              <p className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
                {t("notFound.hintLabel")}
              </p>

              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <li>{t("notFound.reason1")}</li>
                <li>{t("notFound.reason2")}</li>
                <li>{t("notFound.reason3")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useTranslation } from "react-i18next";

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <div className="mb-12 text-center">
      <h1 className="text-foreground text-5xl leading-tight font-bold tracking-tight md:text-6xl">
        {t("home.heroTitle1")}
        <br />
        <span className="text-brand">{t("home.heroTitle2")}</span>
      </h1>
      <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-base leading-relaxed">
        {t("home.heroDescription")}
      </p>
    </div>
  );
}

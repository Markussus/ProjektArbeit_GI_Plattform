import { useTranslation } from "react-i18next";

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <div className="mb-12 text-center">
      <h1
        data-testid="home-hero-title"
        className="text-foreground text-5xl leading-tight font-bold tracking-tight md:text-6xl"
      >
        {t("common.home.heroTitle1")}
        <br />
        <span className="text-brand">{t("common.home.heroTitle2")}</span>
      </h1>
      <p
        data-testid="home-hero-description"
        className="text-muted-foreground mx-auto mt-6 max-w-xl text-base leading-relaxed"
      >
        {t("common.home.heroDescription")}
      </p>
    </div>
  );
}

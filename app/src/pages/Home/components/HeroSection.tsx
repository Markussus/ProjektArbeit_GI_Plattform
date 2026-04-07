import { useTranslation } from 'react-i18next'

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <div className="mb-12 text-center">
      <h1 className="text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
        {t('home.heroTitle1')}
        <br />
        <span className="text-orange-500">{t('home.heroTitle2')}</span>
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
        {t('home.heroDescription')}
      </p>
    </div>
  )
}


import { useTranslation } from 'react-i18next'
import { FileText, BookOpen, Wrench } from 'lucide-react'

export function DocumentationPage() {
    const { t } = useTranslation()

    return (
        <div className="p-8">
            <div className="mb-8">
                <p className="text-sm font-semibold tracking-wide text-brand uppercase">
                    {t('documentation.label')}
                </p>
                <h1 className="mt-2 text-5xl font-bold tracking-tight text-foreground">
                    {t('documentation.title')}
                </h1>
                <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                    {t('documentation.description')}
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
                    <FileText className="size-5 text-muted-foreground" />
                    <h2 className="mt-4 text-lg font-semibold text-foreground">
                        {t('documentation.section1Title')}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {t('documentation.section1Text')}
                    </p>
                </div>

                <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
                    <BookOpen className="size-5 text-muted-foreground" />
                    <h2 className="mt-4 text-lg font-semibold text-foreground">
                        {t('documentation.section2Title')}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {t('documentation.section2Text')}
                    </p>
                </div>

                <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
                    <Wrench className="size-5 text-muted-foreground" />
                    <h2 className="mt-4 text-lg font-semibold text-foreground">
                        {t('documentation.section3Title')}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {t('documentation.section3Text')}
                    </p>
                </div>
            </div>
        </div>
    )
}
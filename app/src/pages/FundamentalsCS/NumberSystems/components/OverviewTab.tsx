import { useTranslation } from 'react-i18next'
import { BookOpen, Lightbulb, Layers, Cpu } from 'lucide-react'

const conceptIcons = [BookOpen, Layers, Lightbulb, Cpu]

export function OverviewTab() {
    const { t } = useTranslation()

    return (
        <div className="space-y-6">
            <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
                <h3 className="text-lg font-semibold text-foreground">
                    {t('number.overviewTitle')}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t('number.overviewText')}
                </p>
            </div>

            <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {t('number.concepts')}
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                    {([1, 2, 3, 4] as const).map((num, i) => {
                        const Icon = conceptIcons[i]

                        return (
                            <div
                                key={num}
                                className="flex items-center gap-3 rounded-lg bg-card p-4 ring-1 ring-foreground/10"
                            >
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-module-purple-bg text-module-purple-fg">
                                    <Icon className="size-4" />
                                </div>

                                <span className="text-sm font-medium text-foreground">
                  {t(`number.concept${num}`)}
                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
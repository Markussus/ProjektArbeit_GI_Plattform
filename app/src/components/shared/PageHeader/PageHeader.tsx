interface PageHeaderProps {
    title: string
    description: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
    return (
        <div className="mb-8">
            <h1 className="text-5xl font-bold tracking-tight text-foreground">
                {title}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {description}
            </p>
        </div>
    )
}
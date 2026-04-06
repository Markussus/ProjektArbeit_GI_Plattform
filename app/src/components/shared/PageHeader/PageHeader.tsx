interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-foreground text-5xl font-bold tracking-tight">
        {title}
      </h1>
      <p className="text-muted-foreground mt-4 max-w-3xl text-lg leading-relaxed">
        {description}
      </p>
    </div>
  );
}

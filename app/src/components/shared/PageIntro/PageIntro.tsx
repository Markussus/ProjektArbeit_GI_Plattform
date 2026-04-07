interface PageIntroProps {
  title: string;
  description: string;
  eyebrow?: string;
}

export function PageIntro({ title, description, eyebrow }: PageIntroProps) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="text-brand text-sm font-semibold tracking-wide uppercase">
          {eyebrow}
        </p>
      )}

      <h1 className="text-foreground mt-2 text-5xl font-bold tracking-tight">
        {title}
      </h1>
      <p className="text-muted-foreground mt-4 max-w-3xl text-lg leading-relaxed">
        {description}
      </p>
    </div>
  );
}

import { ExternalLink, FileBadge2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LicenseItem {
  name: string;
  usage?: string;
  license: string;
  sourceUrl?: string;
  version?: string;
  notice?: string;
}

export interface LicenseListProps {
  items: LicenseItem[];
  className?: string;
}

export function LicenseList({ items, className }: LicenseListProps) {
  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      {items.map((item) => (
        <section
          key={item.name}
          className="bg-card ring-foreground/10 rounded-xl p-6 ring-1"
        >
          <div className="flex items-start gap-3">
            <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md">
              <FileBadge2 className="size-4" />
            </div>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-foreground text-lg font-semibold">
                  {item.name}
                </h2>
                {item.version && (
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                    {item.version}
                  </span>
                )}
              </div>

              {item.usage && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.usage}
                </p>
              )}

              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    License
                  </dt>
                  <dd className="text-foreground mt-1">{item.license}</dd>
                </div>

                {item.sourceUrl && (
                  <div>
                    <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Source
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand inline-flex items-center gap-1 break-all hover:underline"
                      >
                        {item.sourceUrl}
                        <ExternalLink className="size-3" />
                      </a>
                    </dd>
                  </div>
                )}

                {item.notice && (
                  <div>
                    <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Notice
                    </dt>
                    <dd className="text-muted-foreground mt-1 leading-relaxed">
                      {item.notice}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

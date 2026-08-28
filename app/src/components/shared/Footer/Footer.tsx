import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-border bg-background flex h-10 items-center justify-between border-t px-5">
      <a
        href="https://fiw.thws.de"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground text-xs transition-colors"
      >
        {t("footer.copyright")}
      </a>
      <Link
        to="/info#legal"
        className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
      >
        {t("footer.legal")}
      </Link>
    </footer>
  );
}

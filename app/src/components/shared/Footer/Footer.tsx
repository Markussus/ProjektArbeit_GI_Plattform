import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-border bg-background flex h-10 items-center justify-between border-t px-5">
      <p className="text-muted-foreground text-xs">{t("footer.copyright")}</p>
      <Link
        to="/legal"
        className="text-muted-foreground hover:text-foreground text-xs font-medium"
      >
        {t("footer.legal")}
      </Link>
    </footer>
  );
}

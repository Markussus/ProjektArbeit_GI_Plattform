import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="flex h-10 items-center justify-center border-t border-border bg-background px-5">
      <p className="text-xs text-muted-foreground">{t("footer.copyright")}</p>
    </footer>
  );
}

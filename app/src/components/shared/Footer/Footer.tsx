import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-border bg-background flex h-10 items-center justify-center border-t px-5">
      <p className="text-muted-foreground text-xs">{t("footer.copyright")}</p>
    </footer>
  );
}

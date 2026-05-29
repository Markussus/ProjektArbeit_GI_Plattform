import { useTranslation } from "react-i18next";
import { PageIntro } from "@/components/shared/PageIntro/PageIntro";
import {
  LicenseList,
  type LicenseItem,
} from "@/components/shared/LicenseList/LicenseList";

const licenseItems: LicenseItem[] = [
  {
    name: "Project code",
    license: "Licensed separately unless otherwise stated.",
    notice:
      "The original source code of this project is licensed separately from bundled third-party components.",
  },
  {
    name: "TeaVM",
    usage: "Java bytecode to WebAssembly compilation",
    license: "Apache License 2.0",
    sourceUrl: "https://github.com/konsoletyper/teavm",
  },
  {
    name: "teavm-javac",
    usage: "Browser-based Java compiler module",
    license: "Apache License 2.0",
    sourceUrl: "https://github.com/konsoletyper/teavm-javac",
    version: "7e4a44cf521694a4e326e33850dd8aec165eb5c9",
  },
  {
    name: "OpenJDK javac / jdk.compiler",
    usage: "Compiler front-end included in the browser compiler module",
    license: "GNU GPLv2 with the Classpath Exception",
    sourceUrl: "https://github.com/openjdk/jdk25u",
    version: "6c48f4ed707bf0b15f9b6098de30db8aae6fa40f",
    notice:
      "No OpenJDK source files were modified. The OpenJDK components remain licensed under GPLv2 with the Classpath Exception.",
  },
];

export function LegalPage() {
  const { t } = useTranslation();

  return (
    <div data-testid="legal-page" className="space-y-8 p-8">
      <PageIntro
        eyebrow={t("legal.label")}
        title={t("legal.title")}
        description={t("legal.description")}
      />

      <section className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t("legal.summary")}
        </p>
      </section>

      <LicenseList items={licenseItems} />
    </div>
  );
}

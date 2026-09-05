import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  DropdownSelect,
  type DropdownSelectOption,
} from "@/components/shared/DropdownSelect/DropdownSelect";
import { InlineResetControl } from "@/components/shared/InlineResetControl";
import { PageIntro } from "@/components/shared/PageIntro/PageIntro";
import {
  LicenseList,
  type LicenseItem,
} from "@/components/shared/LicenseList/LicenseList";
import { trainingCenterStorage } from "@/lib/trainingCenter";
import { useFont } from "@/hooks/useFont";
import type { AppFont } from "@/lib/font";

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

export function InfoPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const { font, setFont } = useFont();

  const fontOptions: DropdownSelectOption<AppFont>[] = [
    { value: "inter", label: t("common.font.inter") },
    { value: "geist", label: t("common.font.geist") },
  ];

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.replace("#", ""));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.hash]);

  return (
    <div
      data-testid="info-page"
      data-test-id-alias="help-page"
      className="space-y-8 p-8"
    >
      <PageIntro
        eyebrow={t("common.info.label")}
        title={t("common.info.title")}
        description={t("common.info.description")}
      />

      {/* Typography / Font Section */}
      <section
        id="typography"
        className="bg-card ring-foreground/10 rounded-xl p-6 ring-1"
      >
        <h2 className="text-foreground text-lg font-semibold">
          {t("common.font.title")}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {t("common.font.description")}
        </p>
        <div className="mt-4 w-fit">
          <DropdownSelect
            value={font}
            options={fontOptions}
            onChange={(nextFont) => setFont(nextFont)}
            ariaLabel={t("common.font.title")}
            triggerClassName="h-9 min-w-36 justify-between gap-3 px-3 text-sm font-medium"
            menuClassName="left-0 w-full min-w-36"
            optionClassName="text-sm"
            triggerTestId="font-select-trigger"
            menuTestId="font-select-menu"
            optionTestIdPrefix="font-select-option"
          />
        </div>
      </section>

      {/* Progress Reset Section */}
      <section
        id="storage"
        className="bg-card ring-foreground/10 rounded-xl p-6 ring-1"
      >
        <h2 className="text-foreground text-lg font-semibold">
          {t("common.trainingCenter.resetAllProgressTitle")}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {t("common.trainingCenter.resetAllProgressDescription")}
        </p>
        <div className="mt-4">
          <InlineResetControl
            label={t("common.trainingCenter.resetAllProgress")}
            confirmationText={t(
              "common.trainingCenter.confirmResetAllProgress",
            )}
            onConfirm={() => trainingCenterStorage.deleteAll()}
            testId="help-reset-all-progress"
          />
        </div>
      </section>

      {/* Legal & Third-Party Section */}
      <section id="legal" className="space-y-6">
        <div>
          <h2 className="text-foreground text-xl font-bold">
            {t("common.legal.title")}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("common.legal.summary")}
          </p>
        </div>

        <LicenseList items={licenseItems} />
      </section>
    </div>
  );
}

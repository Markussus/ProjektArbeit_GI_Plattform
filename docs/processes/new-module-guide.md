# Leitfaden: Neues Lernmodul & Thema anlegen

Dieser Leitfaden beschreibt Schritt für Schritt, wie ein neues Thema (**Topic**) oder ein neuer Fachbereich (**Modul**) in die GI-Lernplattform integriert wird. Die Architektur trennt globale Rahmenstrukturen, deklarative Metadaten und themenspezifische Implementierungen strikt voneinander, sodass Erweiterungen ohne Umbauten am Routing oder an Kernkomponenten möglich sind.

---

## Begriffsabgrenzung: Modul vs. Topic

* **Modul (Fachbereich):** Übergeordnete Lerneinheit (z. B. *Grundlagen Informatik* `/fundamentals-cs` oder *Programmieren 1* `/programming-1`). Ein Modul bündelt mehrere Topics auf einer Übersichtsseite.
* **Topic (Themenbereich):** Didaktisches Einzelthema (z. B. *Turing-Maschine*, *Moore-/Mealy-Automaten*, *Java-Programmierung*). Jedes Thema nutzt die standardisierte 4-Reiter-Shell (`ModuleTopicPage`).

---

## Ablauf in 6 Schritten

```text
1. Verzeichnis anlegen  -->  2. Speicher-ID  -->  3. Katalogeintrag --> 4. Lazy-Route --> 5. i18n JSONs --> 6. Sprachen reg.  
```

---

### 1. Verzeichnisstruktur anlegen
Unter `app/src/pages/<ModuleName>/<TopicName>/` die vier Tab-Komponenten sowie die Einstiegsseite erstellen:

```text
app/src/pages/<ModuleName>/<TopicName>/
├── components/
│   ├── OverviewTab.tsx       # Theorie & Begriffserklärungen
│   ├── ExamplesTab.tsx       # Vorkonfigurierte Lehrbeispiele
│   ├── ExercisesTab.tsx      # Übungsaufgaben mit Testfällen
│   └── SimulationTab.tsx     # Interaktiver Simulator / Werkbank
└── <TopicName>Page.tsx       # Haupteinstiegspunkt via ModuleTopicPage
```

Beispiel `<TopicName>Page.tsx`:
```tsx
import { ModuleTopicPage } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { OverviewTab } from "./components/OverviewTab";
import { ExamplesTab } from "./components/ExamplesTab";
import { ExercisesTab } from "./components/ExercisesTab";
import { SimulationTab } from "./components/SimulationTab";

export function MeinThemaPage() {
  return (
    <ModuleTopicPage
      topicId="mein-thema"
      overviewTab={<OverviewTab />}
      examplesTab={<ExamplesTab />}
      exercisesTab={<ExercisesTab />}
      simulationTab={<SimulationTab />}
    />
  );
}
```

---

### 2. Speicher-ID vergeben
In `app/src/data/topicStorageIds.ts` eine eindeutige Zahl im Objekt `TOPIC_STORAGE_IDS` hinterlegen. Diese ID isoliert den Speicherstand des Themas im `localStorage`:

```typescript
export const TOPIC_STORAGE_IDS = {
  // ...
  meinThema: 9, // neue eindeutige Zahl
} as const;
```

---

### 3. Katalogeintrag definieren
In `app/src/data/moduleCatalogData.ts` das Thema mit Pfad, Icon und Metadaten dem Modul zuordnen:

```typescript
import { Sparkles } from "lucide-react";

{
  id: "mein-thema",
  storageId: TOPIC_STORAGE_IDS.meinThema,
  titleKey: "mein-thema.title",
  descriptionKey: "mein-thema.description",
  path: "/fundamentals-cs/mein-thema",
  icon: Sparkles,
  accent: "purple",
  tutorialVideoUrl: "https://oc-stream.thws.de/.../video.mp4", // optional
}
```

---

### 4. Lazy-Route einbinden
In `app/src/data/moduleCatalog.tsx` die Seite per `React.lazy()` importieren und in `topicPageElements` eintragen:

```tsx
const MeinThemaTopicPage = lazy(async () => ({
  default: (await import("@/pages/FundamentalsCS/MeinThema/MeinThemaPage")).MeinThemaPage,
}));

const topicPageElements: Record<string, React.ReactElement> = {
  // ...
  "mein-thema": <MeinThemaTopicPage />,
};
```
*(Das Routen-Array `learningRoutes` wird automatisch aus dem Katalog generiert – kein manueller Eintrag in `router/index.tsx` nötig)*

---

### 5. Lokalisierungsdateien anlegen (4 Sprachen)
Die Plattform unterstützt vier Sprachen (`de`, `en`, `tr`, `uk`). Unter `app/src/i18n/locales/` für alle vier Sprachen jeweils eine JSON-Datei für das neue Thema erstellen:
* `app/src/i18n/locales/de/mein-thema.json` (Deutsch)
* `app/src/i18n/locales/en/mein-thema.json` (Englisch)
* `app/src/i18n/locales/tr/mein-thema.json` (Türkisch)
* `app/src/i18n/locales/uk/mein-thema.json` (Ukrainisch)

---

### 6. Sprachdateien registrieren
In `app/src/i18n/index.ts` alle vier JSON-Dateien importieren und in den Sprachobjekten `de`, `en`, `tr` und `uk` als neuer Namespace hinterlegen:

```typescript
import deMeinThema from "./locales/de/mein-thema.json";
import enMeinThema from "./locales/en/mein-thema.json";
import trMeinThema from "./locales/tr/mein-thema.json";
import ukMeinThema from "./locales/uk/mein-thema.json";

// In den jeweiligen Sprachblöcken de, en, tr, uk ergänzen:
const de = {
  // ...
  "mein-thema": deMeinThema,
};
const en = {
  // ...
  "mein-thema": enMeinThema,
};
const tr = {
  // ...
  "mein-thema": trMeinThema,
};
const uk = {
  // ...
  "mein-thema": ukMeinThema,
};
```

---

## 7. Abschlussprüfung
Vor dem Commit den Qualitäts-Check im Terminal ausführen:
```bash
npm run pre:commit:check
```

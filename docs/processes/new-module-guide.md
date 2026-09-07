# Leitfaden: Neues Lernmodul & Thema anlegen

Kurzanleitung zur Integration eines neuen Themas (Topic) in die GI-Lernplattform – abgestimmt auf Kapitel~2.2 der Projektdokumentation.

---

## Ablauf in 6 Schritten

```text
1. Verzeichnis anlegen  -->  2. Speicher-ID  -->  3. Katalogeintrag
                                                          │
6. Sprachdateien reg.   <--  5. i18n JSONs   <--  4. Lazy-Route
```

---

### 1. Verzeichnisstruktur anlegen
Unter `app/src/pages/<ModuleName>/<TopicName>/` die vier Tab-Komponenten sowie die Einstiegsseite erstellen:

```text
app/src/pages/<ModuleName>/<TopicName>/
├── components/
│   ├── OverviewTab.tsx       # Theorie & Erklärungen
│   ├── ExamplesTab.tsx       # Interaktive Beispiele
│   ├── ExercisesTab.tsx      # Übungen mit Validierung
│   └── SimulationTab.tsx     # Simulator-Arbeitsfläche
└── <TopicName>Page.tsx       # Bindet ModuleTopicPage mit den 4 Tabs ein
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
In `app/src/data/topicStorageIds.ts` eine eindeutige Zahl im Objekt `TOPIC_STORAGE_IDS` hinterlegen. Diese ID trennt die Speicherstände im `localStorage`:

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
  accent: "purple", // "orange" | "blue" | "purple" | "green" | "rose"
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
*(Die Route wird hierüber automatisch im Router registriert – kein manueller Eintrag in `router/index.tsx` nötig!)*

---

### 5. Lokalisierungsdateien anlegen
Jeweils eine Übersetzungsdatei für Deutsch und Englisch erstellen:
* `app/src/i18n/locales/de/mein-thema.json`
* `app/src/i18n/locales/en/mein-thema.json`

---

### 6. Sprachdateien registrieren
In `app/src/i18n/index.ts` die beiden JSON-Dateien importieren und in den Objekten `de` und `en` als neuer Namespace einbinden:

```typescript
import deMeinThema from "./locales/de/mein-thema.json";
import enMeinThema from "./locales/en/mein-thema.json";

// In de und en eintragen:
de: { ... deMeinThema, "mein-thema": deMeinThema },
en: { ... enMeinThema, "mein-thema": enMeinThema },
```

---

## 7. Abschlussprüfung
Vor dem Commit den Qualitäts-Check ausführen:
```bash
npm run pre:commit:check
```

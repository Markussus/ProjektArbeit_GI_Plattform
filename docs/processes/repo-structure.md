# Repository-Struktur & Aufteilungsbegründung

Dieses Dokument erläutert den Aufbau des Repositories der **GI-Lernplattform**.
---

## 1. Gesamtübersicht der Repository-Struktur

```text
projektarbeit_gi_plattform/
├── .gitlab-ci.yml                  # GitLab CI/CD Multi-Stage Pipeline Definition
├── ci-browser.dockerfile           # Docker-Image für Playwright E2E & Lighthouse CI
├── ci-node.dockerfile              # Docker-Image für Node.js Builds, Linting & Unit-Tests
├── README.md                       # Allgemeine Projektübersicht & Onboarding-Einstieg
├── THIRD_PARTY_NOTICES.md          # Lizenzhinweise aller verwendeten Open-Source-Bibliotheken
│
├── app/                            # Quellcode der Webanwendung (React 19 SPA)
│   ├── package.json                # Zentrale Abhängigkeiten & NPM-Skripte
│   ├── vite.config.ts              # Vite Bundler- & Plugin-Konfiguration
│   ├── tsconfig.json               # TypeScript Compiler-Konfiguration (Strict Mode)
│   ├── eslint.config.js            # ESLint 9 Flat-Config
│   ├── prettier.config.cjs         # Code-Formatierungsregeln
│   ├── playwright.config.ts        # Playwright E2E-Testkonfiguration
│   ├── lighthouserc.json           # Lighthouse CI Audit-Konfiguration
│   ├── scripts/                    # Wartungs-, Pre-Build- & CI-Hilfsskripte
│   ├── public/                     # Statische Assets & TeaVM WebAssembly-Binärdateien
│   └── src/                        # Anwendungsquelltext (Pages, Components, Logic)
│
├── docs/                           # Projektbegleitende Dokumentation & wissenschaftliche Ausarbeitung
│   ├── documentation/              # Wissenschaftlicher Abschlussbericht (LaTeX, THWS-Vorlage)
│   ├── presentation/               # Beamer-Präsentationsfolien (LaTeX Beamer & PPTX)
│   ├── processes/                  # Architektur-, Tech-Stack- & Prozessdokumentation
│   └── feedback/                   # Feedback von Personen die die Plattform getestet haben
│
└── deployment/                     # Portable Offline-Releases & Bereitstellungswerkzeuge
    ├── create-release.mjs          # Release-Automatisierungsskript
    ├── serve.py                    # Lokaler Python-3-Server (SPA-Routing & WASM-MIME-Typen)
    ├── start.cmd                   # 1-Klick-Starter für Windows
    ├── start.sh                    # 1-Klick-Starter für Linux / macOS
    └── releases/                   # Lokale ZIP-Artefakte für Offline-Auslieferung
```

---

## 2. Repo Aufteilung
Quellcode (`app/`), wissenschaftliche Ausarbeitung (`docs/documentation/`), Beamer-Folien (`docs/presentation/`) und Release-Werkzeuge (`deployment/`) liegen in einem gemeinsamen Git-Repository

### 2.1 Trennung von `app/` und `docs/`
* Die Entwicklungs- und Build-Werkzeuge von Web-Apps (Node.js, Vite, WebAssembly) und Dokumenten (LaTeX, BibTeX, PDF-Generierung) arbeiten mit völlig unterschiedlichen Toolchains und auf verschiedenen Daten.
    * --> `docs/` bleibt unabhängig vom Node-Ökosystem lesbar und pflegbar.

---

## 3. Innenarchitektur des Anwendungsverzeichnisses (`app/`)

Innerhalb von `app/` wird das Prinzip der **Feature-basierten Modularisierung** mit zentraler Registrierung umgesetzt:

```text
app/src/
├── pages/                  # Feature-Slices nach Modul und Thema gegliedert
│   ├── FundamentalsCS/     # Modul: Grundlagen Informatik
│   │   ├── TuringMachine/  # Topic: Turing-Maschine (mit domain, components, exercises)
│   │   ├── FiniteAutomata/ # Topic: Endliche Automaten (DFA/NFA)
│   │   ├── MooreMealy/     # Topic: Mealy- & Moore-Automaten
│   │   ├── RegularLanguages/# Topic: Reguläre Sprachen & Grammatiken
│   │   ├── NumberSystems/  # Topic: Zahlensysteme & Umrechnungen
│   │   ├── Dnf/            # Topic: DNF & KV-Diagramme
│   │   └── Encoding/       # Topic: UTF-8, ASCII & Huffman-Kodierung
│   ├── Programming1/       # Modul: Programmieren 1
│   │   └── Java/           # Topic: Java-Entwicklungsumgebung & WASM-Runner
│   ├── Home/               # Dashboard & Kachel-Übersicht
│   └── Documentation/      # Integrierte Plattformdokumentation
│
├── components/             # UI-Komponentenbibliothek
│
├── data/                   # Single Source of Truth
│   ├── moduleCatalogData.ts# Deklarative Metadaten aller Module & Topics
│   ├── moduleCatalog.tsx   # Lazy-Loading-Verknüpfung und Routen-Export
│   └── topicStorageIds.ts  # Eindeutige IDs für LocalStorage-Persistenz
│
├── router/                 # Client-Routing (React Router 7)
├── store/                  # Globale Zustände (Zustand: themeStore, uiStore)
├── i18n/                   # Übersetzungen nach Namespaces aufgeteilt
└── types/                  # Zentrale TypeScript-Typdefinitionen
```

### 3.1 Warum liegen Themenlogik und UI zusammen in `pages/<Modul>/<Topic>/`?
Anstelle eines veralteten Schichtenmodells ("alle Komponenten in `components/`, alle Logik in `services/`") nutzt die Plattform **Feature Folders**:
* Alles, was z.B. zur Turing-Maschine gehört (Algorithmen, UI-Tabs, Übungen, Testfälle), liegt in einem gemeinsamen Ordner.
* Beim Bearbeiten eines Themas muss der Entwickler nicht quer durch den gesamten Projektbaum springen.
* Löschen oder Umbenennen eines Themas hinterlässt keine verwaisten Code-Fragmente in entfernten Verzeichnissen.

### 3.2 Warum `public/java/compiler/`?
* Der vorkompilierte Java-Compiler (`javac` via TeaVM WebAssembly) ist mehrere Megabyte groß.
* Er liegt in `public/` und wird bei Bedarf zur Laufzeit asynchron vom Web Worker über die `fetch`-API geladen.
* Dadurch wird das Initial-Bundle der React-Anwendung nicht aufgebläht und die Startseite lädt schneller

### 3.3 Warum `app/scripts/`?
* Enthält Node-Skripte (`.mjs`) für Pre-Build-Schritte:
  * `prepare-teavm-javac.mjs`: Überprüft und lädt die TeaVM WASM-Compiler-Dateien vor dem Build.
  * `sync-lighthouserc-from-module-catalog.mjs`: Synchronisiert automatisch alle im `moduleCatalog` registrierten Routen in die Lighthouse-Audit-Konfiguration.
  * `pipeline-local.mjs`: Ermöglicht es Entwicklern, die vollständige GitLab-CI-Pipeline lokal mit einem einzigen Befehl durchzuführen.

# Repository-Struktur & Aufteilungsbegründung

Dieses Dokument erläutert den Aufbau des Repositories der **GI-Lernplattform** und begründet die architektonische Aufteilung der Verzeichnisse und Werkzeuge.

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
│   ├── personal_notes/             # Reflexionen, Feedback & Mitschriften
│   └── PROJEKT_GESAMTUEBERSICHT... # Umfassendes Nachschlagewerk für Verteidigung & Audit
│
└── deployment/                     # Portable Offline-Releases & Bereitstellungswerkzeuge
    ├── create-release.mjs          # Release-Automatisierungsskript
    ├── serve.py                    # Lokaler Python-3-Server (SPA-Routing & WASM-MIME-Typen)
    ├── start.cmd                   # 1-Klick-Starter für Windows
    ├── start.sh                    # 1-Klick-Starter für Linux / macOS
    └── releases/                   # Lokale ZIP-Artefakte für Offline-Auslieferung
```

---

## 2. Warum ist das Repository so aufgeteilt? (Architekturbegründung)

### 2.1 Monorepo-Ansatz statt Multi-Repo
* **Begründung:** Quellcode (`app/`), wissenschaftliche Ausarbeitung (`docs/documentation/`), Beamer-Folien (`docs/presentation/`) und Release-Werkzeuge (`deployment/`) liegen in einem gemeinsamen Git-Repository.
* **Vorteile:**
  * **Atomare Commits:** Änderungen an einer Fachlogik können im selben Commit mit der entsprechenden Dokumentation im LaTeX-Bericht aktualisiert werden. Ein Auseinanderdriften von Code und schriftlicher Arbeit wird verhindert.
  * **Einheitliche Versionskontrolle:** Es gibt nur eine Commit-Historie, ein Issue-Tracking und ein Release-Tagging.
  * **Nachvollziehbarkeit bei der Benotung:** Prüfer und Dozenten finden alle Ergebnisse (Software, Dokumente, Präsentationen) an einem zentralen Ort.

### 2.2 Warum KEIN Workspace-Overhead (Single `package.json`)?
* **Begründung:** Viele Monorepos nutzen Werkzeuge wie npm-/yarn-Workspaces, Turborepo oder Nx. Wir haben uns bewusst für ein **einzelnes `package.json` in `app/`** entschieden.
* **Vorteile:**
  * **Vermeidung von Dependency-Drift:** Es existiert genau eine `package-lock.json`. Keine Versionskonflikte zwischen unterschiedlichen internen Paketen.
  * **Schnelle CI/CD-Zeiten:** `npm ci` muss nur einmal ausgeführt werden, ohne rekursives Auflösen von Workspace-Bäumen.
  * **Geringe Komplexität:** Für neue Entwickler oder Studierende entfällt die Einarbeitung in komplexe Monorepo-Tools.

### 2.3 Strikte Trennung von `app/` und `docs/`
* **Begründung:** Die Entwicklungs- und Build-Werkzeuge von Web-Apps (Node.js, Vite, WebAssembly) und Dokumenten (LaTeX, BibTeX, PDF-Generierung) arbeiten mit völlig unterschiedlichen Toolchains.
* **Vorteile:**
  * Der Frontend-Bundler wird durch LaTeX-Artefakte (`.aux`, `.log`, `.toc`, `.pdf`) nicht verlangsamt.
  * `docs/` bleibt unabhängig vom Node-Ökosystem lesbar und pflegbar.

### 2.4 Kapselung der Bereitstellung in `deployment/`
* **Begründung:** Die GI-Lernplattform muss sowohl online als auch **lokal offline** (z. B. auf Prüfer-Laptops oder USB-Sticks ohne Internetzugang) lauffähig sein.
* **Vorteile:**
  * Das `deployment/`-Verzeichnis enthält eigenständige Starter (`start.cmd`, `start.sh`, `serve.py`), die ein erzeugtes Build-Bundle (`app/dist`) per Python starten.
  * Release-Skripte greifen erst nach erfolgreichem Build ein und verunreinigen nicht das Entwicklungsverzeichnis `app/src/`.

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
│   ├── shared/             # Wiederverwendbare Layout-Blöcke (Header, Sidebar,
│   │                       # ModuleTopicPage-Shell, SimulationWorkspace, Controls)
│   └── ui/                 # Elementare Primitives (Buttons, Dialoge, Badges, Tabs)
│
├── data/                   # Single Source of Truth
│   ├── moduleCatalogData.ts# Deklarative Metadaten aller Module & Topics
│   ├── moduleCatalog.tsx   # Lazy-Loading-Verknüpfung und Routen-Export
│   └── topicStorageIds.ts  # Eindeutige IDs für LocalStorage-Persistenz
│
├── domain/                 # Modulübergreifende Rechenlogik & Interfaces
├── router/                 # Client-Routing (React Router 7)
├── store/                  # Globale Zustände (Zustand: themeStore, uiStore)
├── i18n/                   # Übersetzungen nach Namespaces aufgeteilt
└── types/                  # Zentrale TypeScript-Typdefinitionen
```

### 3.1 Warum liegen Themenlogik und UI zusammen in `pages/<Modul>/<Topic>/`?
Anstelle eines veralteten Schichtenmodells ("alle Komponenten in `components/`, alle Logik in `services/`") nutzt die Plattform **Feature Folders**:
* Alles, was zur Turing-Maschine gehört (Algorithmen, UI-Tabs, Übungen, Testfälle), liegt in einem gemeinsamen Ordner.
* Beim Bearbeiten eines Themas muss der Entwickler nicht quer durch den gesamten Projektbaum springen.
* Löschen oder Umbenennen eines Themas hinterlässt keine verwaisten Code-Fragmente in entfernten Verzeichnissen.

### 3.2 Warum `public/java/compiler/`?
* Der vorkompilierte Java-Compiler (`javac` via TeaVM WebAssembly) ist mehrere Megabyte groß.
* Er liegt in `public/` und wird bei Bedarf zur Laufzeit asynchron vom Web Worker über die `fetch`-API geladen.
* Dadurch wird das Initial-Bundle der React-Anwendung nicht aufgebläht und die Startseite lädt in unter 200 Millisekunden.

### 3.3 Warum `app/scripts/`?
* Enthält Node-Skripte (`.mjs`) für Pre-Build-Schritte:
  * `prepare-teavm-javac.mjs`: Überprüft und lädt die TeaVM WASM-Compiler-Dateien vor dem Build.
  * `sync-lighthouserc-from-module-catalog.mjs`: Synchronisiert automatisch alle im `moduleCatalog` registrierten Routen in die Lighthouse-Audit-Konfiguration.
  * `pipeline-local.mjs`: Ermöglicht es Entwicklern, die vollständige GitLab-CI-Pipeline lokal mit einem einzigen Befehl durchzuführen.

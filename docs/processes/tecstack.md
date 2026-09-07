# Aktueller Tech-Stack & Technologie-Übersicht

Dieses Dokument fasst den aktuellen, produktiv genutzten Tech-Stack der GI-Lernplattform auf Basis der Codebasis und `app/package.json` zusammen.

---

## 1. Systemübersicht

Die Plattform ist eine **reine Client-Only Single-Page Application (SPA)** ohne serverseitige Geschäftslogik oder Datenbank. Alle Berechnungen, Visualisierungen und Code-Kompilierungen laufen direkt im Webbrowser des Nutzers.

| Kernbereich | Eingesetzte Technologie | Version |
| :--- | :--- | :--- |
| **Runtime & Paketmanager** | Node.js (LTS) & npm | `>= 22.12.0` / `>= 11.10.0` |
| **Programmiersprache** | TypeScript (Strict Mode) | `~5.9.3` |
| **Frontend-Framework** | React & React DOM | `^19.2.8` |
| **Build-Tool & Bundler** | Vite (ESM-basiert) | `^8.2.2` |
| **Client-Routing** | React Router DOM | `^7.13.2` |
| **Styling & Design-System**| Tailwind CSS v4 & Lucide Icons | `^4.3.3` / `^1.33.0` |
| **Code-Editor** | Monaco Editor | `^0.56.0` |
| **Java Compiler / Engine**| OpenJDK `javac` + TeaVM (WASM) | Custom Web Worker |
| **State Management** | Zustand | `^5.0.15` |
| **Internationalisierung** | i18next & react-i18next | `^26.4.0` / `^17.0.12` |
| **Unit- & Domain-Tests** | Vitest & Testing Library | `^4.1.11` |
| **End-to-End-Testing** | Playwright (Headless Chromium) | `^1.59.1` |
| **Audit & Performance** | Lighthouse CI & Fallow | `^0.15.1` / `^2.89.0` |
| **Code-Qualität & Style** | ESLint 9 (Flat Config) & Prettier | `^9.39.5` / `^3.9.6` |

---

## 2. Detaillierte Komponenten des Tech-Stacks

### 2.1 Frontend-Architektur & Core Runtime
* **React 19:** Deklaratives Komponentenmodell; optimal abgestimmt auf reaktive Zustandsaktualisierungen in Didaktik-Simulatoren.
* **TypeScript 5.9 (Strict):** Vollständige Typsicherheit für mathematische Modelle (Formale Grammatiken, Turing-Zustände, Übergangsfunktionen).
* **Vite 8:** Ultraschneller Entwicklungs-Server dank nativer ES-Module (HMR) und optimiertes Rollup-Bundling für die Produktion.
* **React Router 7:** Routen-Deklaration über `createBrowserRouter`; alle Module und Themen werden über `React.lazy()` asynchron nachgeladen (Code-Splitting).

### 2.2 Styling, Typografie & UI
* **Tailwind CSS 4:** Modernste Version des Utility-First-CSS-Frameworks über `@tailwindcss/vite`. Nutzt CSS Custom Properties für nahtloses Theme-Switching (Hell / Dunkel) und modulbezogene Akzentfarben (`--color-accent-gi`, `--color-accent-prog`).
* **Geist Variable Font (`@fontsource-variable/geist`):** Moderne Schriftfamilie, lokal gebündelt (100 % DSGVO-konform, kein Nachladen von Google-Servern).
* **Lucide React:** Modulares, performantes SVG-Icon-Set.
* **Shadcn UI & Primitives:** Barrierefreie (WAI-ARIA-konforme), tastaturunterstützte UI-Elemente ohne externe Laufzeit-Abhängigkeiten.

### 2.3 Didaktik- & Ausführungsinfrastruktur
* **Monaco Editor (`monaco-editor`):** Derselbe Code-Editor wie in VS Code. Bietet Syntax-Highlighting, Code-Faltung und direkte Darstellung von Compiler-Fehlermarkern (Squiggles).
* **TeaVM & OpenJDK `javac` (WebAssembly):**
  * Ermöglicht echtes Java-Kompilieren und -Ausführen ohne Serverbetrieb.
  * Läuft in einem isolierten **Web Worker**, wodurch die UI flüssig bleibt und Endlosschleifen über `worker.terminate()` abgebrochen werden können.
* **SVG-Zustandsdiagramme & Force-Directed Graph:**
  * Physikalische Graph-Berechnung zur automatischen Anordnung von Automatenzuständen (DFA, NFA, Mealy/Moore).

### 2.4 State Management & Internationalisierung
* **Zustand 5:** Extrem schlanker Store (< 2 kB) für rein globale UI-Zustände (`themeStore`, `sidebarStore`). Fachspezifische Zustände verbleiben lokal in React-Hooks.
* **i18next-Ökosystem:** Mehrsprachigkeit (Deutsch und Englisch) mit modularer Namespace-Aufteilung pro Thema und typisierten Übersetzungsschlüsseln (`types/i18n.ts`).

---

## 3. Qualitätssicherung, Testing & Code-Audits

Die Codebasis folgt einer vollständigen dreistufigen Testpyramide:

1. **Unit- & Integrationstests (`vitest`):**
   * Blitzschnelle Ausführung der Domänenlogik (Automatenalgorithmen, Zahlensystem-Umrechnungen, DNF-Minimierung) direkt in Node/JSDOM.
   * Befehl: `npm test` oder `npm run test:coverage`
2. **End-to-End-Tests (`playwright`):**
   * Automatisiert vollständige Nutzerinteraktionen im echten Browser (z. B. Automaten zeichnen, Java-Code ausführen, Aufgaben lösen).
   * Befehl: `npm run e2e-test` bzw. `npm run e2e-test:open` (UI-Modus)
3. **Performance & Accessibility Audits (`@lhci/cli`):**
   * Prüft jede Modul- und Topic-Route auf Ladezeiten, Performance, A11y (Barrierefreiheit) und Best Practices.
   * Befehl: `npm run lhci`
4. **Dead-Code- & Duplikats-Prüfung (`fallow`):**
   * Statische Analyse gegen verwaiste Dateien, ungenutzte Exporte und Codeduplikate.
   * Befehl: `npm run fallow:audit`
5. **Code-Style & Linting:**
   * ESLint 9 mit React-Hooks- und TypeScript-Regeln (`npm run lint`).
   * Prettier für einheitliche Formatierung (`npm run format`).

---

## 4. Build, CI/CD & Deployment

* **GitLab CI/CD Pipeline (`.gitlab-ci.yml`):**
  * Mehrstufige Pipeline: `verify` -> `java-compiler` -> `quality` -> `unit` -> `build` -> `e2e` -> `lighthouse`.
  * Eigene Docker-Images (`ci-node.dockerfile`, `ci-browser.dockerfile`) garantieren reproduzierbare Testumgebungen.
* **Supply-Chain-Sicherheit:**
  * `min-release-age=7` in `.npmrc`: Schutz vor kompromittierten Zero-Day-Releases auf npm.
  * `verify:signatures`: Kryptografische Signaturprüfung der Registry.
* **Offline-Release-Distribution (`deployment/`):**
  * `npm run release` erzeugt vorkonfigurierte ZIP-Pakete inklusive Python-3-Server (`serve.py`) und 1-Klick-Starter (`start.cmd`, `start.sh`) für den Betrieb ohne Internetzugang.

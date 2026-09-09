# Tech-Stack & Developer Quickstart

Überblick über die eingesetzten Technologien sowie die ersten Schritte zur lokalen Installation und Entwicklung.

---

## 1. Tech-Stack Übersicht

Die Plattform ist eine **reine Client-Only SPA** ohne serverseitiges Backend:

| Bereich | Technologie | Zweck |
| :--- | :--- | :--- |
| **Framework & Sprache** | React 19, TypeScript 5.9 (Strict) | Reaktive Komponenten & strikte Typisierung |
| **Bundler & Tooling** | Vite | Schnelles HMR & ES-Module Build |
| **Routing** | React Router | Clientseitiges Routing mit `React.lazy()` |
| **Styling & UI** | Tailwind CSS, Lucide Icons | Design-Tokens & modulare Icons |
| **Editor** | Monaco Editor | Java-Code-Eingabe mit Syntax-Highlighting |
| **Java-Laufzeit** | OpenJDK `javac` + TeaVM (WASM) | Kompilieren & Ausführen von Java im Web Worker |
| **State Management** | Zustand | Schlanke globale UI-Stores (`uiStore`, `themeStore`) |
| **Internationalisierung**| i18next & react-i18next | Mehrsprachigkeit (DE/EN) |
| **Testing** | Vitest, Playwright | Unit-, Domänen- und End-to-End-Browser-Tests |
| **Linter & Format** | ESLint, Prettier | Code-Qualität & einheitliche Formatierung |

---

## 2. First Steps für Entwickler (Installation & Start)

### Voraussetzungen
* **Node.js:** `>= 22.12.0` (LTS empfohlen, siehe `.nvmrc`)
* **npm:** `>= 11.10.0`
* **Git**

### Installation in 4 Schritten

```bash
# 1. In das App-Verzeichnis wechseln
cd app

# 2. Abhängigkeiten installieren
npm ci

# 3. Java-Compiler-Assets herunterladen (einmalig Pflicht!)
npm run prepare:java-compiler

# 4. Lokalen Entwicklungsserver starten
npm run dev
```

Die Anwendung ist anschließend unter **`http://localhost:5173`** erreichbar.

> [!NOTE]
> In der `.npmrc` ist `min-release-age=7` konfiguriert. Das schützt das Projekt vor ungeprüften Zero-Day-Paketversionen auf npm.

---

## 3. Die wichtigsten npm-Befehle

Alle Befehle werden im Verzeichnis `app/` ausgeführt:

| Befehl | Zweck |
| :--- | :--- |
| `npm run dev` | Startet den Vite-Dev-Server mit Hot Reload. |
| `npm test` | Führt alle Unit- und Domänentests mit Vitest aus. |
| `npm run build` | Erstellt den produktionsbereiten Build in `app/dist`. |
| `npm run preview` | Startet einen lokalen Server für das gebaute `dist`-Bundle. |
| `npm run lint` | Führt ESLint aus. |
| `npm run format` | Formatiert den Code mit Prettier. |
| `npm run e2e-test` | Führt Playwright-End-to-End-Tests im Browser aus. |
| `npm run pre:commit:check`| Vollständiger Check (Lint, Typecheck, Build) vor dem Commit. |
| `npm run release` | Erstellt das eigenständige Offline-Release-ZIP in `deployment/releases/`. |

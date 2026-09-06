# Entwickler-Onboarding & Lokales Setup

Dieses Dokument beschreibt Schritt für Schritt, wie neue Entwickler die GI-Lernplattform lokal einrichten, starten, testen und fehlerfrei weiterentwickeln.

---

## 1. Systemvoraussetzungen

Vor Beginn müssen folgende Werkzeuge auf dem Entwicklerrechner installiert sein:

* **Node.js:** `>= 22.12.0` (LTS empfohlen, siehe `app/.nvmrc`)
* **npm:** `>= 11.10.0`
* **Git:** Aktuelle Version
* **Optional (für Release-Erstellung):**
  * Python `3.10+` (wird für den lokalen Offline-HTTP-Server `serve.py` benötigt)
  * GitLab CLI (`glab`) für automatisierte GitLab-Releases

---

## 2. Erstmalige Einrichtung (Quickstart)

Führen Sie die folgenden Schritte im Terminal aus:

### 1. Repository klonen
```bash
git clone https://gitlab.com/<repo-pfad>/projektarbeit_gi_plattform.git
cd projektarbeit_gi_plattform
```

### 2. In das Anwendungsverzeichnis wechseln
```bash
cd app
```

### 3. Abhängigkeiten installieren
```bash
npm ci
```

> [!NOTE]
> Das Projekt nutzt die npm-Konfiguration `min-release-age=7`. Dies verhindert die Installation von Paketen, die weniger als 7 Tage auf npm veröffentlicht sind (Schutz vor kompromittierten Zero-Day-Releases).

### 4. Java-Compiler-Artefakte vorbereiten (Einmalig Pflicht)
```bash
npm run prepare:java-compiler
```
*Dieses Skript lädt und verifiziert die WebAssembly-Artefakte für den OpenJDK `javac`-Compiler und legt sie in `app/public/java/compiler/` ab.*

### 5. Entwicklungs-Server starten
```bash
npm run dev
```
Die Anwendung ist nun unter `http://localhost:5173` im Browser erreichbar.

---

## 3. Die wichtigsten npm-Befehle im Entwickler-Alltag

Alle Befehle werden im Verzeichnis `app/` ausgeführt:

| Befehl | Beschreibung |
| :--- | :--- |
| `npm run dev` | Startet den Vite-Entwicklungsserver mit Hot-Module-Replacement (HMR). |
| `npm test` | Führt alle Unit- und Domänentests mit Vitest im schnellen Durchlauf aus. |
| `npm run test:watch` | Startet Vitest im interaktiven Watch-Modus während der Entwicklung. |
| `npm run test:coverage`| Erzeugt einen Testabdeckungs-Report. |
| `npm run e2e-test` | Baut die App und führt alle Playwright-End-to-End-Tests im Headless-Modus aus. |
| `npm run e2e-test:open`| Öffnet die visuelle Playwright-Test-UI zum Debuggen von Klickpfaden. |
| `npm run build` | Bereitet den Java-Compiler vor und baut die produktionsoptimierte SPA nach `app/dist`. |
| `npm run preview` | Startet einen lokalen Vorschau-Server für das gebaute `dist`-Bundle. |
| `npm run lint` | Prüft Quellcode auf Syntax- und Stilfehler mittels ESLint 9. |
| `npm run lint:fix` | Behebt automatische Linter-Probleme. |
| `npm run format` | Formatiert den gesamten Code einheitlich mit Prettier. |
| `npm run fallow:audit` | Prüft die Codebasis auf Dead-Code, verwaiste Exporte und Duplikate. |
| `npm run lhci:config` | Synchronisiert neu hinzugefügte Routen in die Lighthouse-CI-Konfiguration. |
| `npm run pre:commit:check`| Führt vor einem Git-Commit Linting, Format-Check und den Preview-Build durch. |
| `npm run pipeline:local`| Führt die komplette GitLab-CI-Pipeline lokal auf dem Rechner aus. |
| `npm run release` | Erstellt ein getagtes Offline-Release-ZIP in `deployment/releases/`. |

---

## 4. Häufige Fallstricke & Troubleshooting

### Fehler: "Node.js version unsupported"
* **Ursache:** Installierte Node-Version ist älter als `22.12.0`.
* **Lösung:** Node.js über [nodejs.org](https://nodejs.org) aktualisieren oder `nvm use` im Verzeichnis `app/` ausführen.

### Fehler: Java-Simulation meldet "Compiler assets missing"
* **Ursache:** Der Pre-Build-Schritt für den WebAssembly-Compiler wurde nicht ausgeführt.
* **Lösung:** Einmalig im Verzeichnis `app/` den Befehl `npm run prepare:java-compiler` ausführen.

### Fehler: "Package version rejected due to min-release-age"
* **Ursache:** Ein neues npm-Paket wurde vor weniger als 7 Tagen veröffentlicht.
* **Lösung:** Entweder eine Vorgängerversion des Pakets installieren (`npm install paket@version-1`) oder warten, bis das Release 7 Tage alt ist.

### Fehler: WebAssembly lädt lokal nicht (MIME-Type Fehler)
* **Ursache:** Ein einfacher HTTP-Server (z. B. manche Python-Standardserver) liefert `.wasm`-Dateien mit falschem MIME-Type (`application/octet-stream`) aus.
* **Lösung:** Nutzen Sie den mitgelieferten Server `deployment/serve.py` bzw. `npm run preview`, die standardmäßig `application/wasm` und SPA-Routing unterstützen.

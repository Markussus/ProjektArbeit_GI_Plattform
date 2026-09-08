# Git-Workflow, Commits & Release-Leitfaden

Kurzer Leitfaden für Branching, Commits und die Erstellung neuer Plattform-Releases.

---

## 1. Branching-Modell

* **`main`:** Enthält ausschließlich stabile, abgenommene Release-Stände. Keine direkten Commits.
* **`development`:** Zentraler Integrations-Branch für laufende Entwicklungen.
* **Feature-/Fix-Branches:** Werden von `development` abgezweigt.
  * Namensschema: `develop/<thema>`, `fix/<problem>`, `docs/<thema>`.

---

## 2. Commit-Konventionen

Commits folgen dem Schema der **Conventional Commits**:

| Typ | Bedeutung | Beispiel |
| :--- | :--- | :--- |
| `feat:` | Neues Feature / Didaktik-Erweiterung | `feat: add stepBack to Moore simulator` |
| `fix:` | Fehlerbehebung | `fix: resolve WASM memory leak in Java runner` |
| `docs:` | Änderungen an Dokumentation / Texten | `docs: update module guide and architecture` |
| `test:` | Ergänzung oder Korrektur von Tests | `test: add unit tests for DNF minimization` |
| `refactor:` | Code-Überarbeitung ohne Verhaltensänderung | `refactor: clean up topic storage IDs` |

Vor dem Push/Commit empfiehlt sich:
```bash
npm run pre:commit:check
```

---

## 3. Merge Requests & Reviews

1. MR von Feature-Branch nach `development` erstellen.
2. GitLab-CI-Pipeline muss grün durchlaufen (Lint, Unit-Tests, Build, E2E, Lighthouse).
3. Mindestens **1 Approval** eines anderen Teammitglieds erforderlich.

---

## 4. Neuen Release erstellen (Offline-Bundle)

Die Plattform kann als eigenständiges, offline lauffähiges ZIP-Paket für Prüfer oder den Einsatz ohne Internet bereitgestellt werden:

### 1. Release bauen
Im Ordner `app/` ausführen:
```bash
npm run release
```

### 2. Was das Skript macht (`deployment/create-release.mjs`):
1. Führt `npm run build` aus (inklusive Java-WASM-Kompilierung nach `app/dist`).
2. Packt den Build zusammen mit dem Python-Offline-Server (`serve.py`) und den 1-Klick-Startern (`start.cmd`, `start.sh`).
3. Erzeugt ein datiertes/getagtes ZIP-Archiv unter `deployment/releases/`.

### 3. Release lokal testen
Das erzeugte Release oder der Ordner `deployment/` kann direkt offline getestet werden:
* **Windows:** Doppelklick auf `deployment/start.cmd`
* **Linux/macOS:** `./deployment/start.sh`
* **Manuell per Python:** `python deployment/serve.py` (öffnet `http://localhost:8000`)

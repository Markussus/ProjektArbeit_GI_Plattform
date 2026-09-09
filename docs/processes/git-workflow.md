# Git-Workflow, Commits & Release-Leitfaden

Kurzer Leitfaden für Branching, Commits und die Erstellung neuer Plattform-Releases.

---

## 1. Branching-Modell

* **`main`:** Enthält ausschließlich stabile, Release-Stände. Keine direkten Commits
* **`development`:** Zentraler Integrations-Branch für laufende Entwicklungen, keine direkten Commits
* **Feature-/Fix-Branches:** Werden von `development` abgezweigt
  * Namensschema: `develop/<thema>`, `docs/<thema>`.

---

## 2. Commit-Konventionen

Commits folgen dem Schema der **Conventional Commits**:

| Typ | Bedeutung | Beispiel |
| :--- | :--- | :--- |
| `feat:` | Neues Feature / Didaktik-Erweiterung | `feat: add stepBack to Moore simulator` |
| `fix:` | Fehlerbehebung | `fix: resolve WASM memory leak in Java runner` |
| `docs:` | Änderungen an Dokumentation / Texten | `docs: update module guide and architecture` |

Vor dem Push/Commit empfiehlt sich:
```bash
npm run pre:commit:check
```

---

## 3. Merge Requests & Reviews

1. MR von Feature-Branch nach `development` erstellen.
2. GitLab-CI-Pipeline muss grün durchlaufen (Lint, Unit-Tests, Build, E2E, Lighthouse).
3. Mindestens **1 Approval** eines anderen Teammitglieds erforderlich.


1. MR von `development`-Branch nach `main` erstellen.
2. GitLab-CI-Pipeline muss grün durchlaufen (Lint, Unit-Tests, Build, E2E, Lighthouse).
3. Mindestens **2 Approval** anderer Teammitglieder erforderlich.

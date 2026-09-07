# Übergabe-Checkliste & Betriebsleitfaden

Dieses Dokument fasst alle organisatorischen, technischen und wartungsrelevanten Aspekte für die **offizielle Übergabe** der GI-Lernplattform an nachfolgende Entwickler, Betreuer oder die Fakultät Informatik der THWS zusammen.

---

## 1. Übergabe-Checkliste (Handover Status)

| Bereich | Gegenstand / Anforderung | Status | Referenz / Speicherort |
| :--- | :--- | :---: | :--- |
| **Codebasis** | Quellcode vollständig, formatiert und typisiert | Bereit | `app/src/` |
| **Architektur** | Dokumentation der Architektur & Entwurfsmuster | Bereit | [`architecture.md`](file:///C:/Projekte/fix_projektarbeit_gi_plattform/docs/processes/architecture.md) |
| **Erweiterbarkeit**| Schritt-für-Schritt-Anleitung für neue Module & Topics | Bereit | [`new-module-guide.md`](file:///C:/Projekte/fix_projektarbeit_gi_plattform/docs/processes/new-module-guide.md) |
| **Repo-Struktur** | Begründung des Monorepos & der Aufteilung | Bereit | [`repo-structure.md`](file:///C:/Projekte/fix_projektarbeit_gi_plattform/docs/processes/repo-structure.md) |
| **Tech-Stack** | Aktuelle Toolchain- und Bibliotheksübersicht | Bereit | [`tecstack.md`](file:///C:/Projekte/fix_projektarbeit_gi_plattform/docs/processes/tecstack.md) |
| **Git-Workflow** | Branching-Modell, MR-Regeln & Commit-Stil | Bereit | [`git-workflow.md`](file:///C:/Projekte/fix_projektarbeit_gi_plattform/docs/processes/git-workflow.md) |
| **Entwickler-Setup**| Onboarding- & Troubleshooting-Leitfaden | Bereit | [`onboarding-dev-guide.md`](file:///C:/Projekte/fix_projektarbeit_gi_plattform/docs/processes/onboarding-dev-guide.md) |
| **Testing** | Unit-, E2E-, A11y- und Dead-Code-Testabdeckung | Bereit | `npm test`, `npm run e2e-test`, `npm run lhci` |
| **CI/CD** | Multi-Stage GitLab CI Pipeline & Dockerfiles | Bereit | `.gitlab-ci.yml`, `ci-node.dockerfile` |
| **Deployment** | 1-Klick Offline-Starter & Release-Packager | Bereit | `deployment/README.md` |
| **Lizenzen** | Lizenzhinweise für sämtliche Drittanbieter-Pakete | Bereit | `THIRD_PARTY_NOTICES.md`, `README.md` |
| **Wissenschaftl. Doku** | LaTeX-Abschlussbericht & Präsentationsfolien | Bereit | `docs/documentation/`, `docs/presentation/` |

---

## 2. Zentrale Zugänge, externe Ressourcen & Hosting

### 2.1 Repository & CI-Infrastruktur
* **GitLab-Repository:** Gehostet auf der GitLab-Instanz der THWS / Hochschule.
* **Berechtigungen:** Neue Entwickler müssen als *Maintainer* oder *Developer* im GitLab-Projekt hinterlegt werden.
* **CI/CD-Runner:** Die GitLab-Pipeline nutzt Docker-in-Docker bzw. Standard-Docker-Runner. Für Playwright und Lighthouse werden die projekteigenen Dockerfiles (`ci-browser.dockerfile`, `ci-node.dockerfile`) gebaut.

### 2.2 Externe Medien & Lehrvideos (THWS OpenCast)
* Die didaktischen Walkthrough-Videos für die einzelnen Themen werden über den OpenCast-Streamingserver der THWS eingebunden (siehe `app/src/data/moduleCatalogData.ts`).
* **Wichtig bei Änderungen:** Falls neue Videos produziert werden, müssen diese auf dem Streaming-Server der Hochschule bereitgestellt und die MP4-Direktlinks im `moduleCatalogData.ts` hinterlegt werden.

### 2.3 Hosting-Optionen
Da die Plattform ein rein statisches Bundle erzeugt (`npm run build` erzeugt `app/dist/`), kann sie auf beliebigen Zielsystemen betrieben werden:
1. **GitLab Pages:** Automatische Veröffentlichung des `dist/`-Ordners über den GitLab-Pages-Job.
2. **Hochschul-Webserver (Apache / Nginx):**
   * *Wichtig:* SPA-Fallback einrichten (alle Anfragen auf `/index.html` umschreiben, damit clientseitiges Routing via React Router funktioniert).
   * *Wichtig:* MIME-Type für `.wasm`-Dateien auf `application/wasm` setzen.
3. **Lokaler Offline-Betrieb (z. B. auf USB-Sticks für Klausuren oder Vorlesungen):**
   * Das Release-ZIP aus `deployment/releases/` entpacken und per Doppelklick auf `start.cmd` (Windows) bzw. `start.sh` (Linux/Mac) starten.

---

## 3. Potenzielle Erweiterungsfelder für Nachfolgeprojekte

Folgende Themen eignen sich hervorragend für zukünftige Projektarbeiten, Bachelorarbeiten oder Erweiterungssemester:

1. **Zusätzliche GI-Themenmodule:**
   * *Aussagen- & Prädikatenlogik:* Resolution, Horn-Klauseln, Semantic Tableaux.
   * *Kellerautomaten (PDA) & Chomsky-Hierarchie:* Visuelle Simulation eines Kellerautomaten mit animiertem Stack.
   * *Syntaxanalyse / Compilerbau:* LR(k)- und LL(k)-Parser-Visualisierung.
2. **LMS-Integration (Moodle / Ilias):**
   * Export von gelösten Übungsaufgaben als signierter Hash oder LTI-Schnittstelle (Learning Tools Interoperability) zur automatisierten Punkteübernahme in Moodle.
3. **Offline-PWA (Progressive Web App):**
   * Ergänzung eines Service Workers zur vollständigen Offline-Nutzung direkt im Browser ohne Python-Starter.
4. **Erweiterte Java-Features:**
   * Ergänzung visueller Stack- und Heap-Diagramme für Objekt-Instanziierungen und Methoden-Aufrufe.

---

## 4. Urheber & Entwicklungsteam

Ursprünglich entwickelt im Rahmen der Projektarbeit an der THWS (Fakultät Informatik und Wirtschaftsinformatik):

* Markus Nöth
* Richard Schröder
* Enrico Ebert
* Duy Tan Pham
* Kristian Popov

## Prompt (Gemini 3.1 Pro)
Geb mir mögliche WorkItems, damit ich ein neues Feature (einen Simulator mit Debugger für eine Turingmaschine) bauen kann. Der Code soll möglichst wiederverwendbar werden, damit ich Teile des Simulators / Debuggers auch für andere Sachen wiederverwenden kann.

Die spätere Implementierung (NICHT JETZT) soll in app/src/pages/FundamentalsCS/TuringMachine stattfinden.

Analysiere das bestehende Projekt und beschreibe zu jedem WorkItem, was gemacht werden muss, um am Ende eine Turingmaschine im Frontend zu simulieren und zu debuggen. Ich will den kompletten Ablauf von Planung bis zu den Tests

## Revised response

### Phase 1: Generische Architektur & State Management (Wiederverwendbar)
Das Ziel dieser Phase ist es, den "Motor" und die Steuereinheit für *jeden beliebigen* Simulator (Automaten, DNF, Turingmaschinen) zu entwerfen.

**WI-TM-1: Design des generischen Simulator-Interface**
* **Was zu tun ist:** Definiere TypeScript-Interfaces (`ISimulator`) im `types/`-Ordner. Ein Simulator muss generische Methoden bereitstellen wie `initialize(config)`, `step()`, `reset()`, `getCurrentState()`, und `isFinished()`.
* **Warum:** Trennung von reiner Maschinen-Logik und React-UI. Andere Konzepte (Moore/Mealy) können später das gleiche Interface implementieren.

**WI-TM-2: Implementierung des `useSimulationEngine` Hooks (Generischer Debugger-Hook)**
* **Was zu tun ist:** Einen React-Hook erstellen, der den Status (`IDLE`, `RUNNING`, `PAUSED`, `ERROR`), die Ausführungsgeschwindigkeit (`speed` bzw. Ticks-Intervall), sowie die Ausführungs-Schleife verwaltet (z.B. mittels `requestAnimationFrame` oder `setInterval`). Der Hook triggert die `step()` Funktion des in WI-TM-1 definierten Interfaces, verwaltet Start/Stop sowie Error-Boundaries, wenn eine Maschine crasht.
* **Warum:** Die Play/Pause/Step-Logik muss für keinen anderen Automaten jemals neu geschrieben werden.

---

### Phase 2: Business Logic der Turingmaschine (Spezifisch)
Diese Schicht wird reine TypeScript-Logik, unberührt von React, um maximale Testbarkeit zu gewährleisten.

**WI-TM-3: Datenmodelle der Turingmaschine definieren**
* **Was zu tun ist:** Klassen oder Type-Strukturen definieren für: Das unendliche Band (`Tape`, z.B. verwirklicht als zwei Arrays, doppelt verkette Liste oder Sparse-Map), den Lese-/Schreib-Kopf (`Head` Position), die Zustandsmenge `Q`, das Alphabet `Sigma`/`Gamma` und die Überführungsfunktion (`delta`-Table).

**WI-TM-4: Simulator-Logik der Turingmaschine ausprogrammieren**
* **Was zu tun ist:** Eine Klasse `TuringMachineSimulator` schreiben, die das Interface aus WI-TM-1 implementiert. Kern ist die `step()` Methode:
  1. Lese Symbol an Kopf-Position
  2. Schlage aktuellen Zustand + Symbol in Transistionstabelle nach
  3. Schreibe neues Symbol
  4. Bewege Kopf (Links, Rechts, Neutral)
  5. Wechsle Zustand oder wirf Fehler/Haltepunkt

---

### Phase 3: Generische UI-Komponenten (Wiederverwendbar)
Hier bauen wir Ansichten, die als "Debugger" und "Visualisierung" auch für andere Features direkt genutzt werden können.

**WI-TM-5: Entwicklung der generischen Debugger-Toolbar (`SimulatorControls.tsx`)**
* **Was zu tun ist:** Eine UI-Komponente erstellen (in `app/src/components/shared/SimulatorControls/`). Diese enthält Buttons für Play, Pause, Schritt vor, Schritt zurück (sofern Status-Historie gespeichert wird, sehr nützlich für Debugging!) und Neu-Starten. Zudem ein Slider für die Simulationsgeschwindigkeit.
  * Schritt zurück wird nicht implementiert und auch nicht in der UI vorbereitet -> Abstimmen, ob Feature relevant ist
* **Warum:** Kann direkt in `FundamentalsCS/FiniteAutomata` oder `MooreMealy` wiederverwendet werden.

**WI-TM-6: Generische Band-/Array-Visualisierung (`ArrayView.tsx`)**
* **Was zu tun ist:** Eine Komponente für ein (scheinbar) unendliches Array bauen (in `app/src/components/shared/ArrayVisual/`). Sie muss visuell scrollbar/verschiebbar sein und ein Element (den Kopf) farblich hervorheben ("Focus").
* **Warum:** Ein Band wird für die Turingmaschine genutzt, aber Array-Darstellungen (oder Stacks) kommen im Informatik-Studium überall vor.

**WI-TM-7: Generische Status- / Transition-Tabelle Komponente (`TableView.tsx`)**
* **Was zu tun ist:** Eine Komponente, die tabellarische Übergänge anzeigt und die *aktuell ausführende Zeile / Spalte / Zelle* farblich highlighten kann (z.B. wenn sich der Zustand gerade ändert; in `app/src/components/shared/TableVisual/`). Der Nutzer kann Zeilen / Spalten hinzufügen, sofern dies per Props erlaubt wird.
* **Warum:** Transitionstabellen sind nicht nur für Turingmaschinen relevant, sondern auch für endliche Automaten, Moore/Mealy-Automaten, etc.

---

### Phase 4: Spezifische Turingmaschine UI
Hier verwenden Sie den Workspace in `app/src/pages/FundamentalsCS/TuringMachine`.

**WI-TM-8: Turingmaschinen-Konfigurations-View**
* **Was zu tun ist:** Unter `app/src/pages/FundamentalsCS/TuringMachine/components/` Formulare bauen, damit Studierende ihre Maschine konfigurieren können (Transistionen hinzufügen, Startzustand festlegen, Startwort auf das Band schreiben). Bei der Zustandstabelle muss der technische Hinweis unten beachtet werden.

**WI-TM-9: Zusammenführen zur TuringMachine-Workspace**
* **Was zu tun ist:** Das Layout für die Turingmaschine erstellen. Oben/Mittig die Band-Visualisierung (WI-TM-6), unten die Debugging-Controls (WI-TM-5) und daneben die Transition-Tabelle (WI-TM-7). Alles wird verbunden mit dem Hook aus WI-TM-2 und der Instanz aus WI-TM-4.

---

### Phase 5: Integration & Vorbereitung
**WI-TM-10: Page Integration (`TuringMachinePage.tsx`)**
* **Was zu tun ist:** Die fertigen Komponenten in die übliche Struktur einhängen. Nutzung der existierenden `TopicSimulationTab` und `TopicExercisesTab` Komponenten.

**WI-TM-11: Internationalisierung (i18n)**
* **Was zu tun ist:** Begriffe wie "Übergangsfunktion", "Band", "Lese-/Schreibkopf", "Haltezustand" als Keys in `app/src/i18n/locales/de/translation.json` und `en/translation.json` eintragen.

---

### Phase 6: Tests & Qualitätssicherung
**WI-TM-12: Unit-Tests für Core-Engine (Turing-Logik)**
* **Was zu tun ist:** Testfälle entwickeln (z.B. in `TuringMachine.test.ts`) für die Logik (WI-TM-4) isoliert von React.
  - *Beispiel-Test:* Führe Maschine aus, die alle '0'en in '1'en umwandelt. Erwarte das korrekte End-Band nach `isFinished()`.
  - *Beispiel-Test:* Provoziere einen Crash (Übergang nicht definiert), Testlauf verlangt korrekten Error.

**WI-TM-13: Testing des generischen Simulator-Hooks**
* **Was zu tun ist:** Testen von `useSimulationEngine` mit Fake-Timern (wie `vitest.useFakeTimers()`), um zu prüfen ob Start/Stop-Ereignisse richtig in die Hook-States feuern.

**WI-TM-14: UI- / Component-Tests der Debugger-Toolbar**
* **Was zu tun ist:** Testing-Library Tests für den Klick auf Play, Pause, Step und prüfen, ob die passenden Mock-Callbacks der Engine genau 1-mal pro Klick/Intervall ausgelöst werden.

---

### Technischer Hinweis zur Tabelle für die Turingmaschine:
Die **Kopfzeile** besteht aus den Spalten:

1. **δ** (delta-Symbol)

  * Diese erste Spalte ist die **Eingabesymbol-Spalte**.
  * Sie enthält pro Zeile das aktuell gelesene Bandsymbol der Turingmaschine, also zum Beispiel `0`, `1` oder das Leer-/Blank-Symbol.
  * Sie kann jedes Symbol des Alphabets nur einmal enthalten

2. **$q_n$** (Zustand-N)

  * Diese Spalte steht für den Zustand-N.
  * In der Zelle dieser Spalte und einer bestimmten Symbol-Zeile steht, was die Turingmaschine tun soll, **wenn sie im Zustand $q_n$ ist und genau dieses Bandsymbol liest**.

**Wichtiges Format für die Zellen in den Zustands-Spalten**

* Jede Zelle sollte ein Übergangs-Tripel in Klammern enthalten.
* Das Format ist:

`(Folgezustand, Schreibsymbol, Bewegung)`

**Reihenfolge ist wichtig**

1. **Folgezustand** - in welchen Zustand gewechselt wird
2. **Schreibsymbol** - welches Symbol auf das Band geschrieben wird
3. **Bewegung** - Kopfbewegung, typischerweise `L` oder `R`

**Beispiel für das Format**

* `(q1, 0, R)`
* Bedeutung:

  * gehe in Zustand `q1`
  * schreibe `0`
  * bewege den Kopf nach rechts

**Darstellungshinweis**

* Die Zustandsnamen in der Kopfzeile sollten als `q` mit tiefgestellter Zahl erscheinen, also z. B. `q₀`, `q₁`, `q₂`.
* Dasselbe gilt in den Tabelleneinträgen auch für Folgezustände, falls mathematische Schreibweise gewünscht ist.


### Weitere Ideen

*Markus & Richard Notes*:

* Zu WI-TM-1:
  * Evtl. auch einen `stepBack()` zur Verfügung stellen
  * `getCurrentState()` gibt den kompletten Zustand zurück (Band, Kopfposition, aktueller Zustand), damit die UI immer alles hat, um zu rendern bzw. man diesen auch exportieren kann.
* Am unteren Seitenrand eine generische Export / Import Zeile
  * Export / Import mit und ohne Aliasnamen für Zustände

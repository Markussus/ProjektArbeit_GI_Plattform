# Bug Findings & Technische Analyse

Dieses Dokument fasst gefundene Verhaltensweisen, Upstream-Issues von Drittbibliotheken (insb. Monaco Editor) sowie die getroffenen Architekturentscheidungen und Lösungsansätze zusammen.

---

## 1. Monaco Editor: Find-Widget Schließen-Button (`Strg + F`)

### Symptom
Nach Betätigen von `Strg + F` öffnet sich das Monaco Find-Widget. Ein Klick mit der Maus auf das Schließen-Symbol (`X` / `codicon-widget-close`) schließt das Widget teilweise nicht oder reagiert unzuverlässig.

### Ursache
* **Upstream-Issue:** Bekannter Fehler im Monaco Editor (siehe [Monaco Issue #5208](https://github.com/microsoft/monaco-editor/issues/5208)).
* **Technischer Hintergrund:** 
  * Der Standalone-Monaco-Editor verwendet einen zentralen `HoverService`, der Hover-Tooltips (`.workbench-hover-container` / `.monaco-hover`) direkt an `document.body` hängt.
  * Beim Bewegen des Mauszeigers über den Schließen-Button blendet Monaco einen Tooltip ein (`Close (Escape)`).
  * Durch die Positionierung gerät der Tooltip unmittelbar unter den Mauszeiger. Dies löst ein sofortiges `mouseout` auf dem Button aus, gefolgt von einem `mouseover`, wodurch ein hochfrequenter Flacker-Loop entsteht.
  * Gewöhnliche Mausklick-Events (`click`) erreichen dadurch die interne Schaltfläche (`SimpleButton`) nicht oder werden abgebrochen.

### Evaluierte Workarounds & Entscheidung
1. **Globaler CSS-Override (`pointer-events: none` auf Hover-Container):**
   * *Ergebnis:* Der Schließen-Button funktioniert zwar wieder per Klick, jedoch werden dadurch **sämtliche interaktiven Monaco-Tooltips deaktiviert** (z. B. anklickbare Fehlermeldungen, Typ-Informationen, Quick-Fixes).
   * *Entscheidung:* Verworfen, da wichtige Kernfeatures des Editors beschädigt würden.
2. **DOM-Event-Interception in Capture-Phase:**
   * *Ergebnis:* Führt zu unvorhersehbarem Fokus-Verhalten und Nebenwirkungen mit Monacos internem Fokus-Stack.
   * *Entscheidung:* Verworfen.
3. **Natives Schließen via `Escape` (Empfehlung):**
   * *Ergebnis:* Das Find-Widget lässt sich jederzeit zu 100 % zuverlässig über die Taste **`Escape`** schließen.
   * *Entscheidung:* Das Verhalten bleibt als bekannter Upstream-Bug dokumentiert; die native Tastaturbedienung (`Escape`) ist der empfohlene Weg.

---

## 2. Java Monaco Editor: Scroll-Verhalten (Mausrad-Interaktion)

### Anforderung
1. Kein Abfangen des Mausrads beim reinen Durchscrollen der Seite über den Editor.
2. Wenn die Maus über dem Editor verweilt (Hover), soll der Editorinhalt flüssig gescrollt werden.
3. Sobald der obere oder untere Rand des Editorcodes erreicht ist, soll die Hauptseite nahtlos in der gleichen Richtung weiterscrollen.

### Technische Umsetzung
* In [`JavaEditorPanel.tsx`](file:///C:/Projekte/fix_projektarbeit_gi_plattform/app/src/pages/Programming1/Java/components/Simulator/JavaEditorPanel.tsx):
  * **Hover-Erkennung:** Event-Listener für `mouseenter` und `mouseleave` steuern `handleMouseWheel`:
    * Bei `mouseenter`: `handleMouseWheel: true`.
    * Bei `mouseleave`: `handleMouseWheel: false` (Editor fängt kein Scrollen außerhalb ab).
  * **Ränder-Weiterleitung:** Durch `alwaysConsumeMouseWheel: false` ruft Monaco an den Rändern kein `e.preventDefault()` auf, wodurch das Mausrad-Event natürlich an den Browser-Viewport durchgereicht wird.
  * **Lifecycle:** Alle Listener und Focus-/Blur-Abonnements werden bei `editor.onDidDispose` sauber deregistriert.

---

## 3. Moore- & Mealy-Automaten: Tab-Wechsel bei Aufgaben und Beispielen

### Anforderung
Nutzer sollen bei der Bearbeitung einer Moore-Aufgabe oder beim Betrachten eines Moore-Beispiels nicht versehentlich mitten im Prozess auf Mealy umschalten können (und umgekehrt).

### Technische Umsetzung
* In [`automataSimulationContext.ts`](file:///C:/Projekte/fix_projektarbeit_gi_plattform/app/src/pages/FundamentalsCS/MooreMealy/components/automataSimulationContext.ts):
  * Erkennung von Beispielen (`isMooreExample`, `isMealyExample`) und Übungen (`exerciseScenario`).
  * Setzen von `isMachineTypeLocked: true` und `lockedMachineType`.
* In [`InlineTabNavigation.tsx`](file:///C:/Projekte/fix_projektarbeit_gi_plattform/app/src/components/shared/InlineTabNavigation/InlineTabNavigation.tsx) & [`SimulationTab.tsx`](file:///C:/Projekte/fix_projektarbeit_gi_plattform/app/src/pages/FundamentalsCS/MooreMealy/components/SimulationTab.tsx):
  * Gesperrte Tabs erhalten `disabled: true`, `aria-disabled="true"` und Styling mit `cursor-not-allowed text-muted-foreground/40`.
  * Klicks auf den inaktiven Tab werden ignoriert.

---

## 4. Zeilensperren für Programmieraufgaben (Konzeption & Machbarkeitsanalyse)

### Anforderung
Für automatisierte Tests und strukturierte Aufgabenstellung soll im Java-Editor nur ein bestimmter Code-Bereich veränderbar sein. Vorgegebene Zeilen (z. B. Setup-Variablen oder Test-Framework-Aufrufe) sollen gesperrt, ausgegraut und mit einem Schloss versehen werden.

### Ergebnis der Prüfung
Das Feature ist zu 100 % machbar. Das empfohlene und robusteste Pattern ist das **Sentinel-/Marker-Pattern**:

```java
public class Exercise {
    public static void main(String[] args) {
        int eingabe = 42; // <-- Vorgegeben, für Tests dynamisch austauschbar
        
        // === HIER CODE EINFÜGEN ===
        // Student schreibt hier beliebige Anzahl Zeilen
        // === ENDE CODE ===
        
        System.out.println(ergebnis); // <-- Vorgegeben
    }
}
```

### Umgang mit dynamisch eingefügten Zeilen:
1. **Marker-Erkennung:**
   Bei jedem `onDidChangeModelContent` ermittelt ein schneller Regex-Scan die Zeilennummern der beiden Begrenzungs-Kommentare.
   Fügt der Student 10 neue Zeilen ein, wandert der End-Marker automatisch von Zeile 8 auf Zeile 18.
   Es ist keine fehleranfällige manuelle Zeilen-Offset-Berechnung nötig.
2. **Visuelles Feedback:**
   Monaco-Dekorationen markieren alle Zeilen außerhalb der Marker mit `bg-muted/15 opacity-60` und setzen im Zeilenrand (`glyphMargin`) das Icon `codicon-lock`.
3. **Cursor-Enforcement:**
   Bei `onDidChangeCursorPosition` springt der Cursor automatisch in den erlaubten Bereich zurück, wenn in eine gesperrte Zeile geklickt wird.
4. **Schreibschutz:**
   Änderungen außerhalb der Marker werden bei Bedarf via `editor.trigger("guard", "undo", null)` sofort verworfen.

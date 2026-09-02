# Feedback von Alexander

**Profil:** Informatikstudent, 4. Semester  
**Basis:** Software-Commit `7c363fb7a1437eb3fc0e65e066dfa2becf8368cf`

---

## Allgemeines Feedback

- Schönes Design.
- Die Anwendung ist responsiv.
- Rund um die eigentliche Aufgabe könnte mehr Kontrast vorhanden sein.
  - **Ableitung / Ergänzung Markus:** Aufgabe stärker hervorheben, z. B. durch einen fetteren Rahmen oder andere Hilfsmittel
- Der maximale Zoom beim Graphen könnte erhöht werden. Bei sehr vielen Zuständen ist der aktuelle Zoom unter Umständen zu klein.
  - Kommt von der älteren Version ist bereits gefixt
- Es wäre hilfreich, irgendwo einen Hinweis wie **„Last saved“** bzw. den Zeitpunkt der letzten Zwischenspeicherung anzuzeigen.
  - Gilt unabhängig vom Topic, z. B. Moore/Mealy, Java oder Turingmaschine
  - Abwägung von Markus und Richard: nicht nötig, speichern sollte default mäßig alle 10s, beim verlassen der Seite und Export getriggert werden
- Insgesamt sehr schönes Design und passend zur THWS.
- Es wäre schön, noch mehr Topics zu haben, da die Anwendung sehr intuitiv ist.
- Besonders positiv: Man kann auch offline auf dem Laptop, z. B. im Zug, schnell lernen.
- Die Aufgabenbearbeitung ist deutlich effizienter, da Automaten nicht mehrfach per Hand neu gezeichnet werden müssen.

### Von Markus zusätzlich gesehen

- Ein Video zum **Import und Export** wäre sinnvoll, eventuell auf der Help-Page.
- Hinweis zur Java-Compiler-Lizenzierung auf der Help-/Info-Page:

---

## Turingmaschine (TM)

### Feedback

- Das **Nichtszeichen** ist etwas ungewohnt und wird nicht ausreichend erklärt.
- Auch die Eingabe des Nichtszeichens wird aktuell nicht deutlich gezeigt.
  - **Ableitung / Ergänzung Markus:** Kurzer Hinweis, dass das Zeichen für „nichts“ steht und durch `<>` eingegeben werden kann.
- Unklarheit bei `qS`: Was bedeutet dieser Zustand?
  - **Ableitung / Ergänzung Markus:** Deutlich kennzeichnen, dass `qS` der **Stop-Zustand** ist.
- Positiv: Schlichtes Design und nicht zu viele Buttons.
- Sobald man weiß, wie die Tabelle ausgefüllt wird, ist die Bedienung angenehm.

---

## Endliche Automaten

### Feedback

- Grundsätzlich gut umgesetzt.
- Zu Beginn etwas verwirrend, mit dem Video aber verständlich.
- Zu prüfen: Das Alphabet kann aktuell mehrfach die gleichen Symbole enthalten.
  - Dadurch können identische Zeilen entstehen.
  - Behoben durch aktuelle Version
- Ein Dropdown für Zustände wie bei Moore-/Mealy-Automaten wäre sehr angenehm.
- Die Emojis im Stapeltest wirken teilweise zu stark nach ChatGPT.
  - **Vorschlag:** Professionellere Symbole verwenden, z. B. `✓` statt `✅`.
- Speichern funktioniert offenbar erst, wenn auf **Run** gedrückt wird.
  - Falls dies beabsichtigt ist, sollte es in der UI oder Hilfe erklärt werden.

---

## Reguläre Sprachen

### Feedback

- Sehr gelungen.
- Wäre bereits in GTI hilfreich gewesen, insbesondere zum Aufwärmen.
- Manche Details sind auf den ersten Blick nicht direkt intuitiv.
- Mit dem Video sollte die Bedienung aber gut verständlich sein.

---

## Zahlensysteme

### Feedback

- Sehr positiv bewertet.
- Wäre in GTI sehr hilfreich gewesen.
- Besonders gut geeignet, um direkt zu prüfen, ob ein Rechenschritt korrekt ist.
- Sehr hilfreich für die Prüfungsvorbereitung.
- Die Erklärungen sind besonders gelungen:
  - einzelne Rechenschritte,
  - Überträge,
  - Begründungen, warum ein Übertrag entsteht oder nicht.
- Insgesamt sehr gut zum Lernen geeignet.

---

## Moore- & Mealy-Automaten

### Feedback

- Nicht vollständig intuitiv, wenn man gerade nicht im Thema ist.
- Mit dem Video aber gut nutzbar.
- Der Graph ist wichtig für das Verständnis der Grammatik bzw. der Tabelle.
- Die Darstellung der internen Bits ist wichtig, kann teilweise aber etwas zu fortgeschritten wirken.
- Aber gutes design und hilft schnell mal eine Aufgabe in GTI zu machen

### Von Markus zusätzlich gesehen

- Den **Mülleimer / Löschen-Button** so gestalten bzw. platzieren wie bei der Turingmaschine: in der letzten Spalte.
  - Behoben (in rechter Spalte platziert, roter Hover-Effekt beibehalten)

---

## Disjunktive Normalform

### Feedback

- Mehr Kontrast wäre hilfreich, damit sofort klar ist, wo die Bearbeitung beginnt.
- Wenn der Ablauf einmal im Video gezeigt wird, ist die Bedienung direkt verständlich.
- Besonders positiv ist die Erklärung zum **Vereinfachen**.
- Diese Erklärung ist so gut, dass daraus fast ein eigenes Topic entstehen könnte.
- Insgesamt sehr verständlich und didaktisch stark umgesetzt.

---

## Kodierung

### Feedback

- Schön und einfach gestaltet.
- Die Erklärungen sind sehr detailliert.
- Gleichzeitig einfach zu verstehen.
- Insgesamt sehr gut zum Lernen geeignet.

---

## Java

### Feedback

- Das Scrollen im Editor verhält sich teilweise ungewöhnlich.
- Idee: Zeilen sperren, die bei Aufgaben nicht bearbeitet werden dürfen.
- Ist gut wenn man kein Java installiert hat und kurz mal bissl üben will für Prog1 oder so und geht auch auf dem Ipad
  - **Bewertung von Markus:** Sehr gute Idee. Wird ergänzt werden

### Von Markus zusätzlich gesehen

- Nach `Strg + F` ist das `X` zum Schließen teilweise nicht klickbar.

---

# Zusammenfassung der möglichen Verbesserungen

## Priorität: Usability

- Aufgabenbereich visuell stärker hervorheben.
- Turingmaschinen-Nichtszeichen und Eingabe `<>` erklären.
- `qS` eindeutig als Stop-Zustand kennzeichnen.
- Dropdown für Zustände bei endlichen Automaten ergänzen.
- Kontrast bei der disjunktiven Normalform erhöhen.
- Scroll-Verhalten im Java-Editor prüfen.
- Fehler beim Schließen von `Strg + F` im Java-Editor beheben.

## Priorität: Konsistenz

- Professionellere Statussymbole im Stapeltest verwenden.
- Löschen-Button bei Moore/Mealy analog zur Turingmaschine gestalten (behoben).

## Priorität: Dokumentation & Lernunterstützung

- Video zu Import/Export ergänzen.
- Hilfetexte für weniger intuitive Symbole/Zustände ergänzen.
- DNF-Vereinfachung eventuell als eigenes Lern-Topic ausbauen.

---

## Gesamtfazit

Das Gesamtfeedback fällt sehr positiv aus. Besonders hervorgehoben werden:

- das moderne und responsive Design,
- die gute Integration in den THWS-Kontext,
- die intuitive Bedienung nach kurzer Einführung,
- die Offline-Nutzbarkeit,
- die deutliche Zeitersparnis bei Automaten-Aufgaben,
- die detaillierten und verständlichen Erklärungen,
- sowie der hohe Nutzen für Lernen und Prüfungsvorbereitung.

# Titel: Konzeption und Entwicklung einer interaktiven Web-Anwendung für die Lehre der Grundlagen Informatik

**Fokus:** Designentscheidungen, Architektur und KI-Integration

## 1. Einleitung (ca. 2 Seiten)

- **1.1 Problemstellung:** Die Hürde der Abstraktion in der „Grundlagen Informatik"
    
- **1.2 Zielsetzung der Arbeit:** Didaktische Aufbereitung komplexer Modelle durch interaktive Simulationen
    
- **1.3 Methodik:** Vorgehensweise im Team und Rollenverteilung
    

## 2. Übergreifende Architektur & Systemdesign (ca. 3–4 Seiten)

- **2.1 Technologiestack:** React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, Zustand, i18next, Lucide Icons
    
- **2.2 Modulare Softwarearchitektur:** Single Source of Truth (`moduleCatalog.tsx`), lazy Loading, Shared Topic Pattern – Sicherstellung der Erweiterbarkeit für neue Themen
    
- **2.3 Das „Unified UI"-Konzept:** 24 wiederverwendbare Shared Components, konsistentes Designsystem (CSS-Variablen, Dark Mode, moduleigene Akzentfarben, Geist Font)
    
- **2.4 Simulator-Architektur:** Das `ISimulator<TConfig, TState>`-Interface und der generische `useSimulationEngine`-Hook als Grundlage aller schrittweisen Simulationen
    
- **2.5 Datenmodellierung:** Import/Export über `ISimulatorTransferCodec` mit Base64-Kodierung für Vorlesungskompatibilität
    

## 3. Designentscheidungen der Fachmodule (ca. 10–12 Seiten)

- **3.1 Komponente A: Turing-Maschinen & Endliche Automaten**
    
    - 3.1.1 Herausforderung der Visualisierung: Vom Zustandsgraphen zur interaktiven Transitionstabelle
        
    - 3.1.2 Didaktische Entscheidung: Warum schrittweise Simulation (step-by-step) statt reiner Ergebnisausgabe?
        
    - 3.1.3 Umgang mit Komplexität: Breakpoints, State-Diagramm (SVG-Layout-Engine), Batch-Testing und Fehlermeldungen
        
- **3.2 Komponente B: Moore-, Mealy-Automaten & DNF (Disjunktive Normalform)**
    
    - 3.2.1 UI-Lösung zur Gegenüberstellung von Moore- und Mealy-Modellen
        
    - 3.2.2 Logik-Visualisierung: Schrittweise DNF-Ableitung (Wahrheitstabelle → boolescher Ausdruck → DNF-Derivation)
        
    - 3.2.3 Übungsbetrieb: Automatische Aufgabenkontrolle und Feedback-Panel
        
- **3.3 Komponente C: Zahlensysteme & IEEE754**
    
    - 3.3.1 UX-Design für komplexe Rechenoperationen (Umrechnung, Addition, Subtraktion, Multiplikation, Division, Shifting, Vergleich)
        
    - 3.3.2 Der Erklärungsmodus: Wie visualisiert man Fließkommazahlen (IEEE 754) verständlich? Schrittweise Bit-Darstellung und Negativzahlen (Einer-/Zweierkomplement)
        
- **3.4 Komponente D: Kodierungsverfahren (UTF-8 & Base64)**
    
    - 3.4.1 Interaktive Encode/Decode-Simulatoren: Byte-für-Byte-Visualisierung von UTF-8 und Base64
        
    - 3.4.2 Programmatische Aufgabengenerierung: Parametergesteuerte Erzeugung von Übungsaufgaben mit variablem Schwierigkeitsgrad
        
- **3.5 Komponente E: Java-Programmierung**
    
    - 3.5.1 Architektur: Browser-basierte Java-Ausführung via Web Worker und AST-Transpilierung (java-parser)
        
    - 3.5.2 Monaco Editor-Integration: Syntaxhervorhebung und direkte Code-Eingabe ohne lokale IDE
        
    - 3.5.3 Didaktisches Konzept: Automatisierte Quellcode-Validierung und Live-Konsolenausgabe zum Erlernen von Sprachgrundlagen
        

## 4. Einsatz von Künstlicher Intelligenz im Projekt (ca. 3–4 Seiten)

- **4.1 KI als „Co-Developer":** Nutzung von Gemini 3.1 Pro, ChatGPT und Codex als Entwicklungswerkzeuge – Effizienzsteigerung bei der Implementierung mathematischer Logik und UI-Komponenten
    
- **4.2 Automatisierte Aufgabengenerierung:** Parametergesteuerte Erstellung von Übungsaufgaben (Encoding-Modul) als KI-nahes Feature
    
- **4.3 Kritische Reflexion:** Grenzen der KI bei deterministischen Informatik-Modellen (Vermeidung von Halluzinationen, Notwendigkeit manueller Nachbearbeitung, Kontextfenster-Problematik)
    

## 5. Evaluation & Projekterfahrung (ca. 2 Seiten)

- **5.1 Qualitätssicherung:** CI/CD-Pipeline (GitLab Runner auf Raspberry Pi), automatisiertes Linting, Formatierung (Prettier), Unit-Tests (Vitest) und E2E-Tests (Playwright)
    
- **5.2 Abgleich mit dem Lastenheft:** Wurden die Qualitätsziele (Performance, Usability, Barrierefreiheit durch Dark Mode und i18n) erreicht?
    
- **5.3 „Lessons Learned":** Herausforderungen in der Team-Kollaboration (Git-Workflow, Merge-Requests, geteilte Architektur) und technische Hürden
    
- **5.4 Design-Iterationen:** Welche Entscheidungen mussten im Prozess revidiert werden?
    

## 6. Fazit und Ausblick (ca. 1 Seite)

- **6.1 Zusammenfassung der Projektergebnisse:** Sechs interaktive Fachmodule in zwei Lernbereichen
    
- **6.2 Perspektiven:** Gamification (Badges/Punkte), LMS-Anbindung (Moodle/ILIAS) und Mobile Learning (responsive Optimierung)

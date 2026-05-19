# BerichtVorlage

Schlanke LaTeX-Vorlage für Berichte mit:

- Deckblatt ohne Header/Footer
- Vorinhaltsbereich mit **römischen Seitenzahlen**
- Hauptinhalt mit **arabischen Seitenzahlen**
- Nachinhaltsbereich wieder mit **römischen Seitenzahlen**
- konfigurierbarem Header/Footer mit jeweils **3 Spalten**
- Gliederung in bis zu **5 Ebenen** über einen einheitlichen Befehl
- sauberem Inhaltsverzeichnis inklusive optionaler unnummerierter Einträge

Die Vorlage eignet sich gut, wenn du dein Berichtstemplate in Git versionieren willst und eine klare, reproduzierbare Struktur brauchst.

---

## Dateien im Template

Typischer Aufbau:

```text
.
├── BerichtVorlage.sty
├── main.tex
└── LOGO.png              # optionales Logo / Asset
```

### Im Beispiel bestehen die relevanten Dateien aus:

- `BerichtVorlage.sty` - die eigentliche Paketdatei mit allen neuen Befehlen und Umgebungen
- `BerichtBeispiel.tex` - Beispiel zur Verwendung
- `THWS.pdf` - THWS Logo als Beispiel
- `BerichtBeispiel.pdf` - gerendertes Beispiel

---

## Einbindung

```tex
\documentclass[12pt,a4paper]{article}
\usepackage{berichtvorlage}
```

Die Vorlage basiert auf `article` und lädt intern unter anderem:

- `fontenc` mit `T1`
- `babel` mit `ngerman`
- `geometry`
- `lmodern`
- `parskip`
- `fancyhdr`
- `hyperref`

Die Seitenränder sind standardmäßig auf **20 mm** gesetzt.

---

## Schnellstart

**Für mehr Details siehe** `BerichtBeispiel.tex`

```tex
\documentclass[12pt,a4paper]{article}
\usepackage{berichtvorlage}		% Stil einbinden

\title{Mein Bericht}
\author{Richard Schröder}
\date{\today}

\setheaderleft{Linke Kopfzeile}
\setheaderright{Rechte Kopfzeile}

\begin{document}

\begin{Cover}
  \maketitle
\end{Cover}

\begin{PreContent}
	\tableofcontents
\end{PreContent}

\begin{Content}
	\subNsection{0}{Überschrift Ebene 0}
	Text auf Ebene 0.

	\subNsection{1}{Überschrift Ebene 1}
	Text auf Ebene 1.

	\subNsection{2}{Überschrift Ebene 2}
	Text auf Ebene 2.

	\subNsection{3}{Überschrift Ebene 3}
	Text auf Ebene 3.

	\subNsection{4}{Überschrift Ebene 4}
	Text auf Ebene 4.

	\subNsection*{1}{Unnummerierter Abschnitt ohne TOC}
	Dieser Abschnitt erscheint nicht im Inhaltsverzeichnis.

	\subNsection*[toc]{1}{Unnummerierter Abschnitt mit TOC}
	Dieser Abschnitt erscheint im Inhaltsverzeichnis und ist dorthin verlinkt.
\end{Content}

\begin{PostContent}
	\subNsection*[toc]{0}{Anhang}
	Anhangstext.

	Hier kann man ganz viele Anhänge (z. B. Bilder) einfügen.
\end{PostContent}

\end{document}
```

---

## Neue Umgebungen

Die Vorlage führt vier Dokumentbereiche ein.

### `Cover`
Deckblattbereich.

Eigenschaften:

- startet auf einer neuen Seite
- **kein Header / Footer**
- eignet sich für Titelblatt, Logos, Metadaten

Beispiel:

```tex
\begin{Cover}
  ...
\end{Cover}
```

---

### `PreContent`
Vorinhaltsbereich, z. B. für Inhaltsverzeichnis, Abbildungsverzeichnis oder Tabellenverzeichnis.

Eigenschaften:

- startet auf einer neuen Seite
- verwendet den normalen Seitenstil (mit Header und Footer)
- Seitenzählung in **römischen Zahlen**
- setzt den Seitenzähler auf **i** zurück

Beispiel:

```tex
\begin{PreContent}
  \tableofcontents
\end{PreContent}
```

---

### `Content`
Hauptinhalt des Dokuments.

Eigenschaften:

- startet auf einer neuen Seite
- verwendet den normalen Seitenstil (mit Header und Footer)
- Seitenzählung in **arabischen Zahlen**
- setzt den Seitenzähler auf **1** zurück

Beispiel:

```tex
\begin{Content}
  \subNsection{0}{Einleitung}
  ...
\end{Content}
```

---

### `PostContent`
Nachinhaltsbereich, typischerweise für Anhang, Literaturverzeichnis oder Zusatzmaterial.

Eigenschaften:

- startet auf einer neuen Seite
- verwendet den normalen Seitenstil (mit Header und Footer)
- Seitenzählung in **römischen Zahlen**
- setzt den Seitenzähler auf **i** zurück

Beispiel:

```tex
\begin{PostContent}
  \subNsection*[toc]{0}{Anhang}
  ...
\end{PostContent}
```

---

## Neue Befehle

## 1. Header und Footer setzen

Header und Footer bestehen jeweils aus drei Bereichen:

- links
- mitte
- rechts

Dafür gibt es folgende Befehle:

```tex
\setheaderleft{...}
\setheadercenter{...}
\setheaderright{...}

\setfooterleft{...}
\setfootercenter{...}
\setfooterright{...}
```

### Standardverhalten

Wenn man **keine** mittigen Werte setzt, verwendet die Vorlage automatisch:

- Header Mitte: `\theauthor`
- Footer Mitte: `\thepage`

Das heißt: Ohne weitere Konfiguration steht standardmäßig der Autor mittig im Header und die Seitenzahl mittig im Footer.

### Beispiel

```tex
\setheaderright{Entwurf}
\setfooterleft{Intern}
\setfooterright{Vertraulich}
```

### Typische Verwendung

- links: Logo
- Mitte: Autor oder Dokumentname
- rechts: Status wie `Entwurf`, `Freigabe`, `Version 1.0`

---

## 2. `\subNsection` - einheitlicher Gliederungsbefehl

Mit `\subNsection` steuerst du alle Überschriftsebenen (0 bis 4) über **einen** Befehl.

### Syntax

Nummeriert:

```tex
\subNsection{<Ebene>}{<Titel>}
```

Unnummeriert:

```tex
\subNsection*{<Ebene>}{<Titel>}
```

Unnummeriert, aber mit TOC-Eintrag:

```tex
\subNsection*[toc]{<Ebene>}{<Titel>}
```

### Ebenen

| Ebene | Entspricht |
|---|---|
| `0` | `\section` |
| `1` | `\subsection` |
| `2` | `\subsubsection` |
| `3` | `\paragraph` |
| `4` | `\subparagraph` |

### Beispiele

#### Nummerierte Überschriften

```tex
\subNsection{0}{Kapitel}
\subNsection{1}{Unterkapitel}
\subNsection{2}{Abschnitt}
\subNsection{3}{Detailpunkt}
\subNsection{4}{Feinunterpunkt}
```

#### Unnummerierte Überschrift ohne Inhaltsverzeichnis

```tex
\subNsection*{1}{Vorwort}
```

#### Unnummerierte Überschrift mit Inhaltsverzeichnis

```tex
\subNsection*[toc]{1}{Vorwort}
```

### Verhalten bei falscher Ebene

Erlaubt sind nur die Ebenen **0 bis 4**. Bei anderen Werten erzeugt das Paket einen LaTeX-Fehler.

---

## 3. `\paragraph` und `\subparagraph`

Die Vorlage ändert das Standardverhalten von `\paragraph` und `\subparagraph`.

Normalerweise sind diese in `article` oft als **Run-In-Überschriften** definiert, also Überschrift und Fließtext in einer Zeile.
In dieser Vorlage werden sie zu **Block-Überschriften** mit Abstand davor und danach.

Das ist wichtig, weil dadurch die Ebenen 3 und 4 in der Praxis besser lesbar und konsistenter mit den höheren Ebenen werden.

---

## 4. `\theauthor`

Zusätzlich gibt es den Befehl:

```tex
\theauthor
```

Er gibt den Inhalt von `\author{...}` zurück.

Nützlich, um den Autor an mehreren Stellen wiederzuverwenden, ohne ihn doppelt zu pflegen.

Beispiel:

```tex
Autor: \theauthor
```

---

## 5. `\thetitle`

Zusätzlich gibt es den Befehl:

```tex
\thetitle
```

Er gibt den Inhalt von `\title{...}` zurück.

Nützlich, um den Titel an mehreren Stellen wiederzuverwenden, ohne ihn doppelt zu pflegen.

Beispiel:

```tex
Titel: \thetitle
```

---

## 6. `\thedate`

Zusätzlich gibt es den Befehl:

```tex
\thedate
```

Er gibt den Inhalt von `\date{...}` zurück.

Nützlich, um das Datum an mehreren Stellen wiederzuverwenden, ohne es doppelt zu pflegen.

Beispiel:

```tex
Datum: \thedate
```

---

## Inhaltsverzeichnis und Gliederungstiefe

Die Vorlage aktiviert Nummerierung und TOC für 5 Ebenen:

```tex
\setcounter{secnumdepth}{5}
\setcounter{tocdepth}{5}
```

Dadurch erscheinen auch tiefe Ebenen wie `\paragraph` und `\subparagraph` im Inhaltsverzeichnis, sofern sie nummeriert sind oder per `\subNsection*[toc]{<Ebene>}{<Titel>}` explizit eingetragen werden.

---

## Seitenstil

Der Seitenstil basiert auf `fancyhdr`.

Eigenschaften:

- eine horizontale Linie im Header
- keine Linie im Footer
- Header/Footer jeweils als Dreiteiler aufgebaut
- Stil gilt sowohl für normale Seiten als auch für `plain`-Seiten

---

## Titel, Autor, Datum

Die Vorlage selbst definiert automatisch ein minimales Deckblatt mit `\maketitle`.

Die verwendeten Metadaten sind:

```tex
\thetitle
\theauthor
\thedate
```

---

## Kurzreferenz

### Umgebungen

- `Cover` - Deckblatt ohne Seitenzahl, ohne Header/Footer
- `PreContent` - Vorinhaltsbereich mit römischer Seitenzählung
- `Content` - Hauptteil mit arabischer Seitenzählung
- `PostContent` - Nachinhaltsbereich mit römischer Seitenzählung

### Befehle

- `\setheaderleft{...}`
- `\setheadercenter{...}`
- `\setheaderright{...}`
- `\setfooterleft{...}`
- `\setfootercenter{...}`
- `\setfooterright{...}`
- `\subNsection{<Ebene>}{<Titel>}`
- `\subNsection*{<Ebene>}{<Titel>}`
- `\subNsection*[toc]{<Ebene>}{<Titel>}`
- `\theauthor`
- `\thetitle`
- `\thedate`
- `\maketitle`

---

## Anpassung

Passe diese Vorlage am besten direkt in `BerichtVorlage.sty` an, wenn du:

- andere Standardränder brauchst
- den Header/Footer grundlegend anders aufbauen willst
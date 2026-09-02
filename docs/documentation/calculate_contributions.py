#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Berechnung der Beitragsanteile (Zeichen, Wörter, Seiten) zur Projektdokumentation.
Analysiert sowohl die LaTeX-Quelldateien (.tex) als auch das kompilierte PDF (documentation.pdf).
"""

import os
import sys
import glob
import re
import json
import argparse
import subprocess
from collections import defaultdict

# UTF-8 Ausgabe auf Windows-Konsolen sicherstellen
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Bekannte Teammitglieder
TEAM_MEMBERS = [
    "Markus Nöth",
    "Richard Schröder",
    "Enrico Ebert",
    "Duy Tan Pham",
    "Kristian Popov"
]

def normalize_author(name):
    if not name:
        return "Gemeinsam / Allgemein"
    name = name.strip()
    name_clean = name.replace("ö", "ö").replace("ö", "ö").replace("Schrder", "Schröder").replace("Nth", "Nöth")
    for member in TEAM_MEMBERS:
        if member.lower() == name_clean.lower():
            return member
        parts = member.split()
        if len(parts) >= 2:
            initial = f"{parts[0][0]}. {parts[-1]}"
            if initial.lower() == name_clean.lower():
                return member
    if "alle" in name_clean.lower():
        return "Alle (Gemeinsam)"
    return name_clean

def clean_latex(tex):
    """Entfernt LaTeX-Befehle und Kommentare, um den reinen Text zu extrahieren."""
    # 1. Kommentare entfernen
    lines = []
    for line in tex.splitlines():
        comment_idx = -1
        for m in re.finditer(r'(?<!\\)%', line):
            comment_idx = m.start()
            break
        if comment_idx != -1:
            line = line[:comment_idx]
        lines.append(line)
    text = "\n".join(lines)

    # 2. Spezifische Ersetzungen
    text = text.replace(",,", '"').replace("''", '"').replace('"`', '"').replace("'", '"')
    text = re.sub(r'\\[gG]ls(?:pl)?\{([^}]+)\}', r'\1', text)
    text = re.sub(r'\\cite\{[^}]*\}', '', text)
    text = re.sub(r'\\(?:page)?ref\{[^}]*\}', '', text)
    text = re.sub(r'\\label\{[^}]*\}', '', text)
    text = re.sub(r'\\href\{[^}]*\}\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\url\{([^}]*)\}', r'\1', text)

    # 3. Textformatierungen auspacken
    for _ in range(4):
        text = re.sub(r'\\(?:textbf|textit|emph|texttt|underline|text|small|large|Large|normalsize)\{([^}]*)\}', r'\1', text)
    
    text = re.sub(r'\\verb\|([^|]*)\|', r'\1', text)
    text = re.sub(r'\$\$?[^$]+\$\$?', ' ', text)
    
    # 4. Umgebungen entfernen
    text = re.sub(r'\\begin\{(?:figure|table|tabular|tabularx|center|flushleft|flushright|minipage|tcolorbox|HinweisBox|BeispielBox|WarnungBox)\*?\}.*?\\end\{(?:figure|table|tabular|tabularx|center|flushleft|flushright|minipage|tcolorbox|HinweisBox|BeispielBox|WarnungBox)\*?\}', ' ', text, flags=re.DOTALL)
    text = re.sub(r'\\(?:begin|end)\{[^}]*\}', ' ', text)
    
    # 5. Gliederungsbefehle entfernen
    text = re.sub(r'\\subNsection\*?(?:\[.*?\])?\{[^}]*\}\{[^}]*\}(?:\{[^}]*\})?', ' ', text)
    text = re.sub(r'\\[a-zA-Z]+(?:\*|\[.*?\])?(?:\s*\{[^}]*\})*', ' ', text)
    
    # 6. Whitespace normalisieren
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()

def parse_tex_directory(base_dir):
    """Analysiert alle TeX-Dateien im includes/-Ordner."""
    sections = []
    tex_files = sorted(glob.glob(os.path.join(base_dir, "includes", "**", "*.tex"), recursive=True))
    
    for filepath in tex_files:
        relpath = os.path.relpath(filepath, base_dir)
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            
        matches = list(re.finditer(r'\\subNsection\*?(?:\[.*?\])?\{(\d+)\}\{([^}]+)\}(?:\{([^}]+)\})?', content))
        
        if not matches:
            clean = clean_latex(content)
            if clean:
                sections.append({
                    "file": relpath,
                    "section": os.path.splitext(os.path.basename(filepath))[0],
                    "level": 0,
                    "author": "Gemeinsam / Allgemein",
                    "clean_text": clean,
                    "words": len(clean.split()),
                    "chars_with_spaces": len(clean),
                    "chars_no_spaces": len(re.sub(r'\s+', '', clean))
                })
            continue

        for i, m in enumerate(matches):
            lvl = int(m.group(1))
            sec_title = m.group(2).strip()
            sec_author = normalize_author(m.group(3)) if m.group(3) else "Gemeinsam / Allgemein"
            
            start_pos = m.end()
            end_pos = matches[i+1].start() if i+1 < len(matches) else len(content)
            sec_body = content[start_pos:end_pos]
            
            bold_splits = list(re.finditer(r'\\textbf\{([^}]+)\}:', sec_body))
            if bold_splits and (sec_author in ["Alle (Gemeinsam)", "Gemeinsam / Allgemein"]):
                first_pos = bold_splits[0].start()
                intro_body = sec_body[:first_pos].strip()
                if intro_body:
                    c_intro = clean_latex(intro_body)
                    if c_intro:
                        sections.append({
                            "file": relpath,
                            "section": f"{sec_title} (Intro)",
                            "level": lvl,
                            "author": "Alle (Gemeinsam)",
                            "clean_text": c_intro,
                            "words": len(c_intro.split()),
                            "chars_with_spaces": len(c_intro),
                            "chars_no_spaces": len(re.sub(r'\s+', '', c_intro))
                        })
                for b_idx, b_m in enumerate(bold_splits):
                    auth_name = normalize_author(b_m.group(1))
                    b_start = b_m.end()
                    b_end = bold_splits[b_idx+1].start() if b_idx+1 < len(bold_splits) else len(sec_body)
                    auth_body = sec_body[b_start:b_end]
                    c_body = clean_latex(auth_body)
                    if c_body:
                        sections.append({
                            "file": relpath,
                            "section": f"{sec_title} ({auth_name})",
                            "level": lvl,
                            "author": auth_name,
                            "clean_text": c_body,
                            "words": len(c_body.split()),
                            "chars_with_spaces": len(c_body),
                            "chars_no_spaces": len(re.sub(r'\s+', '', c_body))
                        })
            else:
                c_body = clean_latex(sec_body)
                if c_body:
                    sections.append({
                        "file": relpath,
                        "section": sec_title,
                        "level": lvl,
                        "author": sec_author,
                        "clean_text": c_body,
                        "words": len(c_body.split()),
                        "chars_with_spaces": len(c_body),
                        "chars_no_spaces": len(re.sub(r'\s+', '', c_body))
                    })
    return sections

def analyze_pdf_file(pdf_file):
    """Extrahiert und analysiert Text und Seitenanteile aus dem fertigen PDF."""
    if not os.path.exists(pdf_file):
        return None
        
    try:
        res = subprocess.run(["pdftotext", pdf_file, "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
        if res.returncode != 0:
            return None
    except Exception:
        return None
        
    pages = res.stdout.split("\x0c")
    current_author = "Gemeinsam / Allgemein"
    current_section = "Intro"
    
    page_stats = defaultdict(lambda: defaultdict(lambda: {"words": 0, "chars": 0, "lines": 0}))
    author_pages_map = defaultdict(set)
    author_totals = defaultdict(lambda: {"words": 0, "chars": 0, "pages_weighted": 0.0})
    
    content_page_count = 0
    for page_idx, page_text in enumerate(pages):
        page_num = page_idx + 1
        if not page_text.strip():
            continue
            
        page_type = "Content"
        if page_num == 1:
            page_type = "Cover"
        elif page_num in (2, 3):
            page_type = "PreContent"
        elif page_num >= 45:
            page_type = "PostContent"
        else:
            content_page_count += 1
            
        lines = page_text.splitlines()
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
                
            # Kopf- und Fußzeilen ignorieren
            if "M. N" in line_str and "Schr" in line_str and "Popov" in line_str:
                continue
            if line_str == "Projektarbeit":
                continue
            if re.match(r'^\d+$', line_str) or re.match(r'^[ivxLCDM]+$', line_str):
                continue
                
            # Überschriften mit Autor erkennen
            m_sec = re.search(r'^(?:\d+(?:\.\d+)*\s+)?([^\n(]+)\s*\(([^)]+)\)', line_str)
            if m_sec:
                title = m_sec.group(1).strip()
                auth = m_sec.group(2).strip()
                norm = normalize_author(auth)
                if norm in TEAM_MEMBERS:
                    current_author = norm
                    current_section = title
                elif "alle" in auth.lower():
                    current_author = "Alle (Gemeinsam)"
                    current_section = title
            
            # Autoren-Absatz-Präfixe erkennen
            m_bold = re.match(r'^([A-Z][a-zäöüß]+\s+[A-Z][a-zäöüß]+(?:\s+[A-Z][a-zäöüß]+)?):\s*(.*)', line_str)
            if m_bold:
                prefix_name = normalize_author(m_bold.group(1))
                if prefix_name in TEAM_MEMBERS:
                    current_author = prefix_name
            
            words_count = len(line_str.split())
            chars_count = len(line_str)
            
            auth_category = current_author if page_type == "Content" else "Vorspann / Anhang"
            page_stats[page_num][auth_category]["words"] += words_count
            page_stats[page_num][auth_category]["chars"] += chars_count
            page_stats[page_num][auth_category]["lines"] += 1
            
            if page_type == "Content":
                author_pages_map[current_author].add(page_num - 3)
    
    # Anteilige Seitengewichtung berechnen
    for p_num, p_data in page_stats.items():
        total_p_words = sum(d["words"] for d in p_data.values())
        if total_p_words > 0:
            for auth, d in p_data.items():
                share = d["words"] / total_p_words
                author_totals[auth]["pages_weighted"] += share
                author_totals[auth]["words"] += d["words"]
                author_totals[auth]["chars"] += d["chars"]
                
    return {
        "author_totals": dict(author_totals),
        "author_pages": {k: sorted(list(v)) for k, v in author_pages_map.items()},
        "total_pdf_pages": len([p for p in pages if p.strip()]),
        "content_page_count": content_page_count
    }

def print_table(headers, rows, alignments=None):
    if not rows:
        return
    alignments = alignments or ['<'] * len(headers)
    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(cell)))
            
    header_line = " | ".join(f"{h:{alignments[i]}{col_widths[i]}}" for i, h in enumerate(headers))
    sep_line = "-+-".join("-" * col_widths[i] for i in range(len(headers)))
    print(header_line)
    print(sep_line)
    for row in rows:
        print(" | ".join(f"{str(cell):{alignments[i]}{col_widths[i]}}" for i, cell in enumerate(row)))

def main():
    parser = argparse.ArgumentParser(description="Berechne Beitragsanteile (Zeichen, Wörter, Seiten) zur Dokumentation.")
    parser.add_argument("--dir", default=os.path.dirname(os.path.abspath(__file__)), help="Pfad zum Dokumentationsordner")
    parser.add_argument("--pdf", default="documentation.pdf", help="Dateiname der PDF-Datei")
    parser.add_argument("--chars-per-page", type=int, default=None, help="Zeichen inkl. LZ pro formatierter A4-Seite (Standard: automatisch aus Dokumentendichte, ca. 3385 Zeichen/Seite)")
    parser.add_argument("--export-md", help="Pfad für Markdown-Report Export (z.B. report.md)")
    parser.add_argument("--export-json", help="Pfad für JSON Export (z.B. stats.json)")
    parser.add_argument("--detail", action="store_true", help="Ausführliche Aufschlüsselung aller einzelnen Abschnitte anzeigen")
    args = parser.parse_args()

    doc_dir = args.dir
    pdf_full_path = os.path.join(doc_dir, args.pdf) if not os.path.isabs(args.pdf) else args.pdf

    # 1. LaTeX-Quelldateien analysieren
    tex_sections = parse_tex_directory(doc_dir)
    tex_stats = defaultdict(lambda: {"words": 0, "chars_ws": 0, "chars_ns": 0, "sections": 0})
    
    for sec in tex_sections:
        a = sec["author"]
        tex_stats[a]["words"] += sec["words"]
        tex_stats[a]["chars_ws"] += sec["chars_with_spaces"]
        tex_stats[a]["chars_ns"] += sec["chars_no_spaces"]
        tex_stats[a]["sections"] += 1

    total_tex_words = sum(s["words"] for s in tex_stats.values())
    total_tex_chars_ws = sum(s["chars_ws"] for s in tex_stats.values())
    total_tex_chars_ns = sum(s["chars_ns"] for s in tex_stats.values())
    team_tex_chars_ws = sum(tex_stats[a]["chars_ws"] for a in TEAM_MEMBERS)

    # 2. PDF-Ausgabe analysieren
    pdf_res = analyze_pdf_file(pdf_full_path)
    
    # Automatische Berechnung der tatsächlichen Zeichendichte pro A4-Seite
    content_pages = pdf_res["content_page_count"] if pdf_res else 41
    if args.chars_per_page is not None:
        chars_per_page = args.chars_per_page
    else:
        # Dynamisch aus echtem Dokumentlayout (138.770 Z. auf 41 Hauptseiten = ~3.385 Z./Seite)
        chars_per_page = round(team_tex_chars_ws / content_pages) if content_pages else 3385

    print("=" * 80)
    print("  BEITRAGSANALYSE DER PROJEKTDOKUMENTATION")
    print("  Interaktive Lernplattform für Grundlagen Informatik")
    print("=" * 80)
    print(f"Verzeichnis:        {doc_dir}")
    print(f"PDF-Datei:          {pdf_full_path} (Vorhanden: {'Ja' if os.path.exists(pdf_full_path) else 'Nein'})")
    print(f"Layout-Dichte:      {chars_per_page:,} Zeichen/Seite (basiert auf 41 Inhaltsseiten im A4-Layout)\n".replace(",", "."))

    # 3. Haupt-Ergebnistabelle aufbauen
    print("+" + "-" * 78 + "+")
    print("| 1. GESAMTÜBERSICHT NACH TEAMMITGLIEDERN (TEX-QUELLE & PDF-LAYOUT)            |")
    print("+" + "-" * 78 + "+")
    
    page_col_name = f"Seiten (~{chars_per_page} Z.)"
    headers = [
        "Autor / Mitglied",
        "Wörter (TeX)",
        "Zeichen (inkl)",
        "Zeichen (ohne)",
        "Anteil %",
        page_col_name,
        "PDF-Seiten (anteilig)",
        "Seiten (PDF)"
    ]
    aligns = ['<', '>', '>', '>', '>', '>', '>', '<']
    rows = []

    sorted_authors = sorted(
        [a for a in tex_stats.keys() if a in TEAM_MEMBERS],
        key=lambda x: tex_stats[x]["words"],
        reverse=True
    )
    for a in sorted(tex_stats.keys()):
        if a not in sorted_authors:
            sorted_authors.append(a)

    for author in sorted_authors:
        st = tex_stats[author]
        pct = (st["words"] / total_tex_words * 100) if total_tex_words else 0
        pages_calc = st["chars_ws"] / chars_per_page
        
        pdf_pages_weighted = "-"
        pdf_pages_range = "-"
        if pdf_res and author in pdf_res["author_totals"]:
            pdf_pages_weighted = f"{pdf_res['author_totals'][author]['pages_weighted']:.2f} S."
        if pdf_res and author in pdf_res["author_pages"] and pdf_res["author_pages"][author]:
            p_list = pdf_res["author_pages"][author]
            pdf_pages_range = f"S. {min(p_list)}-{max(p_list)} ({len(p_list)} S.)"
            
        rows.append([
            author,
            f"{st['words']:,}".replace(",", "."),
            f"{st['chars_ws']:,}".replace(",", "."),
            f"{st['chars_ns']:,}".replace(",", "."),
            f"{pct:5.1f} %",
            f"{pages_calc:5.2f} S.",
            pdf_pages_weighted,
            pdf_pages_range
        ])

    total_calc_pages = team_tex_chars_ws / chars_per_page
    total_pdf_p = f"{sum(v['pages_weighted'] for k, v in pdf_res['author_totals'].items() if k in TEAM_MEMBERS):.2f} S." if pdf_res else "-"
    rows.append([
        "SUMME TEAM (Fachinhalt)",
        f"{sum(tex_stats[a]['words'] for a in TEAM_MEMBERS):,}".replace(",", "."),
        f"{sum(tex_stats[a]['chars_ws'] for a in TEAM_MEMBERS):,}".replace(",", "."),
        f"{sum(tex_stats[a]['chars_ns'] for a in TEAM_MEMBERS):,}".replace(",", "."),
        f"100.0 %",
        f"{total_calc_pages:5.2f} S.",
        total_pdf_p,
        f"{content_pages} Hauptseiten" if pdf_res else "-"
    ])

    print_table(headers, rows, aligns)
    print()

    # 4. Detail-Tabelle nach Abschnitten
    if args.detail:
        print("+" + "-" * 78 + "+")
        print("| 2. DETAILLIERTE ABSCHNITTSAUFSCHLÜSSELUNG                                   |")
        print("+" + "-" * 78 + "+")
        sec_headers = ["Datei", "Abschnitt / Kapitel", "Autor", "Wörter", "Zeichen (inkl)"]
        sec_aligns = ['<', '<', '<', '>', '>']
        sec_rows = []
        for s in tex_sections:
            sec_rows.append([
                os.path.basename(s["file"]),
                s["section"][:40],
                s["author"],
                f"{s['words']:,}".replace(",", "."),
                f"{s['chars_with_spaces']:,}".replace(",", ".")
            ])
        print_table(sec_headers, sec_rows, sec_aligns)
        print()

    # 5. Exportoptionen
    export_data = {
        "summary": {
            "total_words": total_tex_words,
            "total_chars_with_spaces": total_tex_chars_ws,
            "total_chars_no_spaces": total_tex_chars_ns,
            "chars_per_page": chars_per_page,
            "total_calculated_pages": round(total_calc_pages, 2),
            "total_pdf_content_pages": content_pages
        },
        "authors": {}
    }
    
    for author in sorted_authors:
        st = tex_stats[author]
        pct = (st["words"] / total_tex_words * 100) if total_tex_words else 0
        pages_calc = round(st["chars_ws"] / chars_per_page, 2)
        pdf_share = round(pdf_res["author_totals"][author]["pages_weighted"], 2) if (pdf_res and author in pdf_res["author_totals"]) else None
        pdf_pages = pdf_res["author_pages"].get(author, []) if pdf_res else []
        export_data["authors"][author] = {
            "words": st["words"],
            "chars_with_spaces": st["chars_ws"],
            "chars_no_spaces": st["chars_ns"],
            "percentage": round(pct, 2),
            "calculated_pages": pages_calc,
            "pdf_pages_weighted": pdf_share,
            "pdf_pages_list": pdf_pages,
            "sections_count": st["sections"]
        }

    if args.export_json:
        with open(args.export_json, "w", encoding="utf-8") as jf:
            json.dump(export_data, jf, indent=2, ensure_ascii=False)
        print(f"[OK] JSON-Report exportiert nach: {args.export_json}")

    if args.export_md:
        md_content = []
        md_content.append("# Beitragsstatistik zur Projektdokumentation\n")
        md_content.append(f"- **Projekt:** Interaktive Lernplattform für Grundlagen Informatik")
        md_content.append(f"- **Berechnungsbasis:** {chars_per_page:,} Zeichen/Seite (basiert auf dem tatsächlichen A4-Layout mit {content_pages} Hauptseiten)".replace(",", "."))
        md_content.append(f"- **Gesamtumfang:** {total_tex_words:,} Wörter | {total_tex_chars_ws:,} Zeichen (inkl. LZ) | {total_calc_pages:.2f} Seiten\n".replace(",", "."))
        md_content.append("## Übersicht nach Teammitgliedern\n")
        md_content.append(f"| Autor | Wörter (TeX) | Zeichen (inkl. LZ) | Zeichen (ohne LZ) | Anteil % | Seiten (~{chars_per_page} Z.) | PDF-Seiten (anteilig) | PDF-Seitenbereich |")
        md_content.append("|:---|---:|---:|---:|---:|---:|---:|:---|")
        for row in rows:
            md_content.append(f"| {row[0]} | {row[1]} | {row[2]} | {row[3]} | {row[4]} | {row[5]} | {row[6]} | {row[7]} |")
        
        md_content.append("\n## Detailaufschlüsselung der Abschnitte\n")
        md_content.append("| Datei | Abschnitt | Autor | Wörter | Zeichen (inkl. LZ) |")
        md_content.append("|:---|:---|:---|---:|---:|")
        for s in tex_sections:
            md_content.append(f"| `{os.path.basename(s['file'])}` | {s['section']} | {s['author']} | {s['words']:,} | {s['chars_with_spaces']:,} |".replace(",", "."))
            
        with open(args.export_md, "w", encoding="utf-8") as mf:
            mf.write("\n".join(md_content))
        print(f"[OK] Markdown-Report exportiert nach: {args.export_md}")

if __name__ == "__main__":
    main()

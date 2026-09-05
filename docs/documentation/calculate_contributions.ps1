<#
.SYNOPSIS
    Berechnet die Beitragsanteile (Zeichen, Wörter, Seiten) aller Teammitglieder
    an der LaTeX- und PDF-Dokumentation.

.DESCRIPTION
    Führt das Python-Skript 'calculate_contributions.py' aus und bietet praktische
    Parameter für Detailansichten sowie Exporte (Markdown / JSON).

.PARAMETER Detail
    Zeigt die detaillierte Aufschlüsselung aller einzelnen Abschnitte an.

.PARAMETER ExportMd
    Exportiert die Statistiken als Markdown-Bericht (z. B. 'contributions_report.md').

.PARAMETER ExportJson
    Exportiert die Statistiken im JSON-Format (z. B. 'contributions.json').

.PARAMETER CharsPerPage
    Definiert die Anzahl der Zeichen inkl. Leerzeichen pro Seite (Standard: automatisch aus Dokumentendichte, ca. 3385 Zeichen/Seite).

.EXAMPLE
    .\calculate_contributions.ps1

.EXAMPLE
    .\calculate_contributions.ps1 -Detail -ExportMd contributions_report.md
#>

[CmdletBinding()]
param(
    [switch]$Detail,
    [string]$ExportMd,
    [string]$ExportJson,
    [int]$CharsPerPage
)

$scriptDir = $PSScriptRoot
$pyScript = Join-Path $scriptDir "calculate_contributions.py"

if (-not (Test-Path -LiteralPath $pyScript)) {
    Write-Error "Das Skript 'calculate_contributions.py' wurde nicht im Verzeichnis '$scriptDir' gefunden."
    exit 1
}

$pyArgs = @("`"$pyScript`"", "--dir", "`"$scriptDir`"")

if ($CharsPerPage -gt 0) {
    $pyArgs += @("--chars-per-page", $CharsPerPage)
}
if ($Detail) {
    $pyArgs += "--detail"
}
if ($ExportMd) {
    $pyArgs += @("--export-md", "`"$ExportMd`"")
}
if ($ExportJson) {
    $pyArgs += @("--export-json", "`"$ExportJson`"")
}

# UTF-8 Konsole sicherstellen
try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

python $pyArgs

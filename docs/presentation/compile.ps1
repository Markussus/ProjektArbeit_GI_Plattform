# Compile LaTeX project with pdflatex + biber

$ErrorActionPreference = "Stop"

$MainFile = "presentation.tex"
$JobName = [System.IO.Path]::GetFileNameWithoutExtension($MainFile)

if (-not (Test-Path $MainFile)) {
    Write-Error "Main TeX file not found: $MainFile"
}

Write-Host "Cleaning old build files..."
$Extensions = @(
    "aux", "bbl", "bcf", "blg", "log", "out",
    "run.xml", "toc", "lof", "lot", "fls", "fdb_latexmk",
    "synctex.gz"
)

foreach ($ext in $Extensions) {
    Remove-Item "$JobName.$ext" -ErrorAction SilentlyContinue
}

Write-Host "Running pdflatex pass 1..."
pdflatex -interaction=nonstopmode -halt-on-error $MainFile

Write-Host "Running pdflatex pass 2..."
pdflatex -interaction=nonstopmode -halt-on-error $MainFile

Write-Host "Cleaning build files..."
$Extensions = @(
    "aux", "bbl", "bcf", "blg", "log", "out",
    "run.xml", "toc", "lof", "lot", "fls", "fdb_latexmk",
    "synctex.gz", "snm", "vrb", "nav"
)

foreach ($ext in $Extensions) {
    Remove-Item "$JobName.$ext" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Done. Output PDF:"
Write-Host "$JobName.pdf"

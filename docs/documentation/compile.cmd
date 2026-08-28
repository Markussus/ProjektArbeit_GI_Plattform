@echo off
setlocal enabledelayedexpansion

set "MainFile=documentation.tex"
set "JobName=documentation"

if not exist "%MainFile%" (
    echo ERROR: Main TeX file not found: %MainFile%
    exit /b 1
)

echo Cleaning old build files...

for %%E in (
    aux bbl bcf blg log out
    run.xml toc lof lot fls fdb_latexmk
    synctex.gz
) do (
    del /q "%JobName%.%%E" 2>nul
)

echo Running pdflatex pass 1...
pdflatex -interaction=nonstopmode -halt-on-error "%MainFile%"
if errorlevel 1 exit /b 1

echo Running biber pass 1...
biber "%JobName%"
if errorlevel 1 exit /b 1

echo Running pdflatex pass 2...
pdflatex -interaction=nonstopmode -halt-on-error "%MainFile%"
if errorlevel 1 exit /b 1

rem Double biber needed for citations in the glossary
echo Running biber pass 2...
biber "%JobName%"
if errorlevel 1 exit /b 1

echo Running pdflatex pass 3...
pdflatex -interaction=nonstopmode -halt-on-error "%MainFile%"
if errorlevel 1 exit /b 1

echo Running pdflatex pass 4...
pdflatex -interaction=nonstopmode -halt-on-error "%MainFile%"
if errorlevel 1 exit /b 1

echo Cleaning build files...

for %%E in (
    aux bbl bcf blg log out
    run.xml toc lof lot fls fdb_latexmk
    synctex.gz
) do (
    del /q "%JobName%.%%E" 2>nul
)

echo.
echo Done. Output PDF:
echo %JobName%.pdf

endlocal
@echo off
setlocal EnableExtensions

rem Compile LaTeX project with pdflatex

set "MAIN_FILE=presentation.tex"
for %%F in ("%MAIN_FILE%") do set "JOB_NAME=%%~nF"

if not exist "%MAIN_FILE%" (
    echo ERROR: Main TeX file not found: %MAIN_FILE%
    exit /b 1
)

echo Cleaning old build files...
for %%E in (aux bbl bcf blg log out run.xml toc lof lot fls fdb_latexmk synctex.gz) do (
    if exist "%JOB_NAME%.%%E" del /q "%JOB_NAME%.%%E" >nul 2>&1
)

echo Running pdflatex pass 1...
pdflatex -interaction=nonstopmode -halt-on-error "%MAIN_FILE%"
if errorlevel 1 exit /b %errorlevel%

echo Running pdflatex pass 2...
pdflatex -interaction=nonstopmode -halt-on-error "%MAIN_FILE%"
if errorlevel 1 exit /b %errorlevel%

echo Cleaning build files...
for %%E in (aux bbl bcf blg log out run.xml toc lof lot fls fdb_latexmk synctex.gz snm vrb nav) do (
    if exist "%JOB_NAME%.%%E" del /q "%JOB_NAME%.%%E" >nul 2>&1
)

echo.
echo Done. Output PDF:
echo %JOB_NAME%.pdf

endlocal
exit /b 0

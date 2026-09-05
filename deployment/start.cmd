@echo off
setlocal

cd /d "%~dp0"

echo ==========================================
echo   GI Training Center
echo ==========================================
echo.
echo Starting local web server...
echo.

where py >nul 2>&1
if %errorlevel%==0 (
    py -3 serve.py
    goto :end
)

where python >nul 2>&1
if %errorlevel%==0 (
    python serve.py
    goto :end
)

echo.
echo ERROR: Python 3 was not found.
echo.
echo Please install Python 3 and try again.
echo.
pause

:end
endlocal
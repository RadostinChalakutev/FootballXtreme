@echo off
setlocal

cd /d "%~dp0"
set "FX_JAR=target\football-xtreme-1.0.0.jar"

echo.
echo ==========================================
echo       FOOTBALLXTREME VENUE OS
echo ==========================================
echo.

where java >nul 2>nul
if errorlevel 1 (
    echo Java 25 is required and was not found on PATH.
    echo Use Docker Compose or install Java 25, then run this file again.
    exit /b 1
)

if not exist "%FX_JAR%" (
    echo Build artifact not found: %FX_JAR%
    echo Run "mvn clean package" first, or use "docker compose up --build".
    exit /b 1
)

echo Starting FootballXtreme on http://localhost:8080 ...
java -jar "%FX_JAR%"

endlocal

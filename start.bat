@echo off
setlocal

cd /d "%~dp0"

echo.
echo ==========================================
echo          FOOTBALLXTREME
echo ==========================================
echo.

echo Starting application...

start "" /B "%~dp0runtime\bin\java.exe" -jar "%~dp0target\football-xtreme-1.0.0.jar"

echo Waiting for FootballXtreme...

:wait
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:8080/api/config' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"

if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait
)

echo.
echo FootballXtreme is ready.
echo Opening browser...

start "" "http://localhost:8080"

exit /b 0
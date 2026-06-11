@echo off
REM =============================================================================
REM TankLotse — alle Dev-Services in separaten Fenstern starten
REM Aufruf: scripts\start-dev.bat
REM Ports:  Backend 3000  |  Landing 3001  |  Admin 3002  (wie package.json)
REM Voraussetzung: Docker-Stack laeuft
REM   docker compose -p tanklotse -f infrastructure\docker-compose.dev.yml up -d
REM =============================================================================

set ROOT=%~dp0..

start "TankLotse Backend :3000" cmd /k "cd /d "%ROOT%\backend" && npm run start:dev"
timeout /t 2 /nobreak >nul
start "TankLotse Landing :3001" cmd /k "cd /d "%ROOT%\landingpage" && npm run dev"
start "TankLotse Admin :3002"   cmd /k "cd /d "%ROOT%\admin-dashboard" && npm run dev"

echo.
echo Drei Fenster wurden gestartet:
echo   Backend  ^>  http://localhost:3000/health
echo   Landing  ^>  http://localhost:3001
echo   Admin    ^>  http://localhost:3002
echo   Swagger  ^>  http://localhost:3000/docs/api
echo   Mailpit  ^>  http://localhost:8026
echo   Adminer  ^>  http://localhost:8081
echo.
echo Stoppen: scripts\stop-dev.bat
echo Warte ca. 15 Sekunden bis alle Services bereit sind.
pause

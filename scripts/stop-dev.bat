@echo off
REM =============================================================================
REM TankLotse — alle Dev-Services stoppen (Backend 3000, Landing 3001, Admin 3002)
REM Beendet die Node-Prozesse, die auf den Dev-Ports lauschen.
REM Docker-Stack bleibt laufen — stoppen mit:
REM   docker compose -p tanklotse -f infrastructure\docker-compose.dev.yml down
REM =============================================================================

echo Stoppe TankLotse-Dev-Services (Ports 3000-3002)...

powershell -NoProfile -Command ^
  "foreach ($port in 3000,3001,3002) {" ^
  "  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue;" ^
  "  if ($conns) {" ^
  "    $conns | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {" ^
  "      try { Stop-Process -Id $_ -Force -ErrorAction Stop; Write-Host ('  Port ' + $port + ': PID ' + $_ + ' beendet') }" ^
  "      catch { Write-Host ('  Port ' + $port + ': PID ' + $_ + ' nicht beendbar') }" ^
  "    }" ^
  "  } else { Write-Host ('  Port ' + $port + ': nichts zu stoppen') }" ^
  "}"

echo.
echo Fertig. Docker-Stack (Postgres/Redis/Mailpit/Adminer) laeuft weiter.
pause

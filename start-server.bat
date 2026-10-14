@echo off
setlocal
title AccessEase - Admin Server (1434)
cd /d "%~dp0"
set "TASK_SERVER_URL=http://localhost:1434/"
if not exist ".local\admin-auth.json" (
    echo ERROR: Configure an admin account first. See README.md.
    pause
    exit /b 1
)
where node.exe >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js 24 or newer is required. You can also use start-docker.bat.
    pause
    exit /b 1
)
powershell.exe -NoProfile -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:1434/login' -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -eq 200) { exit 0 } } catch {}; exit 1" >nul 2>nul
if not errorlevel 1 (
    echo AccessEase is already running. Opening %TASK_SERVER_URL%
    start "" "%TASK_SERVER_URL%"
    exit /b 0
)
start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "$ProgressPreference = 'SilentlyContinue'; for ($attempt = 0; $attempt -lt 80; $attempt++) { try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:1434/login' -UseBasicParsing -TimeoutSec 1; if ($response.StatusCode -eq 200) { Start-Process 'http://localhost:1434/'; break } } catch {}; Start-Sleep -Milliseconds 250 }" >nul 2>nul
echo AccessEase admin login: %TASK_SERVER_URL%
echo Keep this window open. Press Ctrl+C to stop the server.
node server\admin.mjs
pause
endlocal

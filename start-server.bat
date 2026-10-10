@echo off
setlocal
title AccessEase - Local Server (1434)
set "TASK_SERVER_ROOT=%~dp0dist"
set "TASK_SERVER_URL=http://localhost:1434/"

if not exist "%TASK_SERVER_ROOT%\index.html" (
    echo ERROR: Website files were not found in "%TASK_SERVER_ROOT%".
    pause
    exit /b 1
)

powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 1434 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if not errorlevel 1 (
    echo Port 1434 is already in use. No second server was started.
    start "" "%TASK_SERVER_URL%"
    pause
    exit /b 0
)

where py.exe >nul 2>nul
if not errorlevel 1 goto run_py
where python.exe >nul 2>nul
if not errorlevel 1 goto run_python
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" goto run_bundled

echo ERROR: Python was not found. Install Python and run this file again.
pause
exit /b 1

:run_py
echo Starting AccessEase at %TASK_SERVER_URL%
echo Keep this window open. Press Ctrl+C to stop the server.
py.exe -3 -m http.server 1434 --bind 127.0.0.1 --directory "%TASK_SERVER_ROOT%"
goto finished

:run_python
echo Starting AccessEase at %TASK_SERVER_URL%
echo Keep this window open. Press Ctrl+C to stop the server.
python.exe -m http.server 1434 --bind 127.0.0.1 --directory "%TASK_SERVER_ROOT%"
goto finished

:run_bundled
echo Starting AccessEase at %TASK_SERVER_URL%
echo Keep this window open. Press Ctrl+C to stop the server.
"%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m http.server 1434 --bind 127.0.0.1 --directory "%TASK_SERVER_ROOT%"

:finished
echo Server stopped. If it could not start, check the error above.
pause
endlocal

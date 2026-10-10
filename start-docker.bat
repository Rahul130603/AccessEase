@echo off
setlocal
title AccessEase - Docker

where docker.exe >nul 2>nul
if errorlevel 1 (
    echo ERROR: Docker Desktop is not installed or docker is not on PATH.
    pause
    exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
    echo ERROR: Docker is not running. Open Docker Desktop and wait until the engine is ready.
    echo Then double-click this file again.
    pause
    exit /b 1
)

docker compose -f "%~dp0compose.yaml" up -d --build
if errorlevel 1 (
    echo ERROR: Docker could not start the website. Check the error above.
    echo If port 1434 is occupied by the Python server, stop it with Ctrl+C first.
    pause
    exit /b 1
)

echo AccessEase is running in Docker at http://localhost:1434/
start "" "http://localhost:1434/"
echo You can close this window; the Docker container keeps running.
echo To stop it: docker compose -f "%~dp0compose.yaml" down
pause
endlocal

@echo off
chcp 65001 >nul
title TaskManagement Baslatici
cd /d "%~dp0"

echo Arka taraf (API) baslatiliyor...
start "TaskManagement API - KAPATMAYIN" cmd /k "cd /d "%~dp0TaskManagement.API" && dotnet run --launch-profile http"

echo On taraf (arayuz) baslatiliyor...
if not exist "%~dp0TaskManagementUI\node_modules" (
  start "TaskManagement Arayuz - KAPATMAYIN" cmd /k "cd /d "%~dp0TaskManagementUI" && npm install && npm start"
) else (
  start "TaskManagement Arayuz - KAPATMAYIN" cmd /k "cd /d "%~dp0TaskManagementUI" && npm start"
)

echo.
echo Hazir olmasi bekleniyor, tarayici birazdan acilacak...
timeout /t 25 /nobreak >nul
start "" http://localhost:4200
exit

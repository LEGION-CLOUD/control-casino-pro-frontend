@echo off
title CASINO CONTROL - Iniciador
cd /d D:\CasinoControl\backend
echo Apagando procesos viejos...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo Iniciando BACKEND...
start "BACKEND CASINO" cmd /k "cd /d D:\CasinoControl\backend && node Server-Con-Auditoria.js"
timeout /t 3 /nobreak >nul
echo Iniciando FRONTEND...
start "FRONTEND CASINO" cmd /k "cd /d D:\CasinoControl\frontend && npm run dev"
timeout /t 3 /nobreak >nul
echo.
echo ====================================
echo  BACKEND: http://localhost:3001
echo  FRONTEND: http://localhost:5173
echo  Esperá 5 segundos y abrí Chrome
echo ====================================
pause

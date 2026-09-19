@echo off
title Jujutsu Kaisen: Phantom Parade DB - Modo Desktop
echo =======================================================
echo    Jujutsu Kaisen: Phantom Parade DB (Desktop Offline)
echo =======================================================
echo.
cd /d "%~dp0"

echo [1/2] Sincronizando e compilando aplicacao...
call npm run build

echo [2/2] Iniciando janela nativa Desktop...
call npx electron .

echo.
echo Aplicacao finalizada.

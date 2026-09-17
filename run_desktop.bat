@echo off
title Jujutsu Kaisen: Phantom Parade DB - Modo Desktop
echo =======================================================
echo    Jujutsu Kaisen: Phantom Parade DB (Desktop Offline)
echo =======================================================
echo.
cd /d "%~dp0"

echo [1/2] Verificando arquivos de distribuicao...
if not exist "dist\index.html" (
    echo Compilando aplicacao pela primeira vez...
    call npm run build
)

echo [2/2] Iniciando janela nativa Desktop...
call npx electron .

echo.
echo Aplicacao finalizada.

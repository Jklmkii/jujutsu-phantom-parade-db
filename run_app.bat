@echo off
chcp 65001 > nul
title JJKPPDB - Database Offline de Jujutsu Kaisen: Phantom Parade
cls

echo =====================================================================
echo    JJKPPDB - Jujutsu Kaisen: Phantom Parade (Database Offline)
echo =====================================================================
echo.
echo [1/3] Verificando integridade dos dados locais...
cd /d "%~dp0"

if not exist "node_modules" (
    echo Instalando dependencias iniciais...
    call npm install
)

echo [2/3] Sincronizando dados dos personagens, memorias e imagens...
python scripts/compile_data.py

echo.
echo [3/3] Iniciando o aplicativo offline...
echo O navegador abrira automaticamente em instantes!
echo Para encerrar o aplicativo, basta fechar esta janela do terminal.
echo.

start "" http://localhost:5173
call npm run dev -- --host

pause

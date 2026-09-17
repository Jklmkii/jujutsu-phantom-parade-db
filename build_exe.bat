@echo off
title Jujutsu Kaisen: Phantom Parade DB - Gerador de Executavel Windows
echo =======================================================
echo    Jujutsu Kaisen: Phantom Parade DB - Build Windows (.exe)
echo =======================================================
echo.
cd /d "%~dp0"

node scripts/build_exe.cjs

echo.
pause

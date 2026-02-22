@echo off
chcp 65001 >nul
cd /d "%~dp0"

title Pizzeria Napolitana

rem ── Verificar dependencias minimas ──────────────────────────────────────────
if not exist "node_modules" goto :no_install
if not exist ".next\BUILD_ID"  goto :no_build

rem ── Lanzar ────────────────────────────────────────────────────────────────
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0scripts\launcher.ps1"
goto :end

:no_install
echo.
echo  [ERROR] La aplicacion no esta instalada.
echo  Ejecuta CONSTRUIR.bat primero (solo hace falta una vez).
echo.
pause
exit /b 1

:no_build
echo.
echo  [ERROR] La aplicacion no esta compilada.
echo  Ejecuta CONSTRUIR.bat primero (solo hace falta una vez).
echo.
pause
exit /b 1

:end

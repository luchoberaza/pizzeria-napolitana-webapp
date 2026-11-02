@echo off
chcp 65001 >nul
cd /d "%~dp0"

title Pizzeria Napolitana

if not exist "runtime\node.exe" goto :incompleto
if not exist "app\server.js"    goto :incompleto

powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0runtime\iniciar.ps1"
goto :end

:incompleto
echo.
echo  [ERROR] Faltan archivos de la aplicacion.
echo.
echo  Asegurate de haber DESCOMPRIMIDO el ZIP completo
echo  (no ejecutes esto desde adentro del ZIP).
echo.
pause
exit /b 1

:end

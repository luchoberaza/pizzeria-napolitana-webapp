@echo off
setlocal
title Pizzeria Napolitana - Lanzador

echo ==========================================
echo    INICIANDO PIZZERIA NAPOLITANA
echo ==========================================
echo.

:: Verificar si existe la carpeta de compilacion .next
if not exist ".next" (
    echo [ERROR] No se encontro la carpeta de compilacion .next.
    echo Por favor, ejecuta primero: CONSTRUIR_PROGRAMA.bat
    echo.
    pause
    exit /b 1
)

:: Iniciar el servidor Next.js en segundo plano
echo [1/2] Iniciando motor del programa...
start /min "PizzeriaServer" cmd /c "npm run start"

:: Esperar a que el servidor este listo
echo [2/2] Conectando con el servidor...
node scripts/check-ready.mjs

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] No se pudo establecer conexion con el motor interno.
    echo Intenta cerrar el programa por completo y volver a abrirlo.
    echo.
    pause
    exit /b 1
)

:: Abrir en modo Aplicacion
echo.
echo [LISTO] Abriendo ventana del programa...
start msedge --app=http://127.0.0.1:3000

echo.
echo ==========================================
echo    PROGRAMA EN EJECUCION
echo ==========================================
echo Puedes minimizar esta ventana.
echo Para cerrar, cierra la ventana de la Pizzeria y luego esta consola.
echo.
pause

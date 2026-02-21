@echo off
title Pizzeria Napolitana - Lanzador
echo ==========================================
echo    INICIANDO PIZZERIA NAPOLITANA
echo ==========================================
echo.

:: Verificar si existe node_modules
if not exist "node_modules" (
    echo [ERROR] No se encontraron las dependencias instaladas.
    echo Por favor, ejecuta primero: CONSTRUIR_PROGRAMA.bat
    pause
    exit /b
)

:: Verificar si existe la carpeta de compilacion .next
if not exist ".next" (
    echo [ERROR] No se encontro la carpeta de compilacion .next.
    echo Por favor, ejecuta primero: CONSTRUIR_PROGRAMA.bat
    echo Esto preparara el motor del programa para su primer uso.
    pause
    exit /b
)

:: Iniciar el servidor Next.js en segundo plano
echo [1/2] Iniciando servidor interno (Produccion)...
echo Ten en cuenta que solo puede haber una pizzeria abierta a la vez.
start /min "PizzeriaServer" cmd /c "npm run start"

:: Esperar a que el servidor este listo
echo [2/2] Verificando que el sistema este listo...
node scripts/check-ready.mjs

:: Si el chequeo fallo, no abrir el navegador
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] No se pudo conectar con el servidor interno.
    echo Posible causa: El puerto 3000 esta siendo usado por otro programa.
    pause
    exit /b
)

:: Abrir en modo Aplicación (sin barras de navegador)
echo.
echo [LISTO] Abriendo ventana del programa...
start msedge --app=http://localhost:3000

echo.
echo ==========================================
echo    EL PROGRAMA ESTA FUNCIONANDO
echo ==========================================
echo No cierres esta ventana mientras uses el programa.
echo.
pause

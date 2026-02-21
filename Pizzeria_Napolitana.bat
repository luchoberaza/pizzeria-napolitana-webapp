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

:: Iniciar el servidor Next.js en segundo plano
echo [1/2] Iniciando servidor interno...
start /min "PizzeriaServer" cmd /c "npm run start"

:: Esperar a que el servidor este listo
echo [2/2] Esperando que el sistema este listo para usar...
node scripts/check-ready.mjs

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

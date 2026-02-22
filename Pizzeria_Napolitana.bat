@echo off
setlocal
title Pizzeria Napolitana - Lanzador

echo ==========================================
echo    INICIANDO PIZZERIA NAPOLITANA
echo ==========================================
echo.

:: 1. Verificar si ya hay algo corriendo en el puerto 3000
netstat -ano | findstr :3000 > nul
if %errorlevel% equ 0 (
    echo [INFO] El motor ya parece estar en marcha.
    goto :check_ready
)

:: 2. Verificar carpeta de compilacion
if not exist ".next" (
    echo [ERROR] No se encontro la carpeta de compilacion .next.
    echo.
    echo Por favor, ejecuta primero: CONSTRUIR_PROGRAMA.bat
    echo.
    pause
    exit /b 1
)

:: 3. Iniciar el servidor
echo [1/2] Encendiendo el motor...
start /min "PizzeriaServer" cmd /c "npm run start"

:check_ready
:: 4. Esperar al servidor
echo [2/2] Conectando con el sistema...
node scripts/check-ready.mjs

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] No se pudo conectar con el sistema.
    echo.
    echo Posibles causas:
    echo - El puerto 3000 esta bloqueado.
    echo - Hubo un error al iniciar el motor (puedes intentar 'npm run start' en una consola para ver el error).
    echo.
    pause
    exit /b 1
)

:: 5. Abrir App
echo.
echo [LISTO] Abriendo aplicacion...
start msedge --app=http://127.0.0.1:3000

echo.
echo ==========================================
echo    INSTANCIA ACTIVA
echo ==========================================
echo Ya puedes usar el programa.
echo NO CIERRES esta ventana hasta que termines de trabajar.
echo.
pause

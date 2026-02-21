@echo off
title Pizzeria Napolitana - Instalador / Constructor
echo ==========================================
echo    CONSTRUYENDO PIZZERIA NAPOLITANA
echo ==========================================
echo.

:: Verificar Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] No se encontro Node.js instalado en esta PC.
    echo Por favor, instala Node.js desde https://nodejs.org/ para continuar.
    pause
    exit /b
)

echo [1/4] Instalando paquetes necesarios (esto puede tardar)...
call npm install --omit=dev

echo.
echo [2/4] Preparando el motor del programa...
call npm run build

echo.
echo [3/4] Inicializando la base de datos...
if not exist "data" mkdir "data"
call npm run db:init

echo.
echo [4/4] Limpiando archivos temporales...
echo.

echo ==========================================
echo    ¡TODO LISTO!
echo ==========================================
echo Ya podes cerrar esta ventana y usar el programa
echo ejecutando "Pizzeria_Napolitana.bat".
echo.
pause

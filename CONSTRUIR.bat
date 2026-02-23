@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Pizzeria Napolitana - Instalacion

echo.
echo  ============================================
echo     PIZZERIA NAPOLITANA - Instalacion
echo  ============================================
echo.

rem ── 1. Verificar Node.js ─────────────────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js no esta instalado o no esta en el PATH.
    echo.
    echo  Descargalo desde: https://nodejs.org  (version LTS recomendada)
    echo  Luego REINICIA la computadora y vuelve a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% detectado.
echo.

rem ── 2. Crear .env.local si no existe ─────────────────────────────────────────
if not exist ".env.local" (
    echo  [1/3] Creando configuracion de base de datos...
    echo SQLITE_DB_PATH=data/pizzeria.sqlite> .env.local
    echo  [OK] .env.local creado.
) else (
    echo  [1/3] Configuracion ya existe, se mantiene.
)
echo.

rem ── 3. Instalar dependencias ──────────────────────────────────────────────────
echo  [2/3] Instalando dependencias (puede tardar unos minutos)...
echo.
call npm install
if errorlevel 1 (
    echo.
    echo  [ERROR] Fallo la instalacion de dependencias.
    echo  Revisa tu conexion a internet e intenta de nuevo.
    echo.
    pause
    exit /b 1
)
echo.
echo  [OK] Dependencias instaladas.
echo.

rem ── 4. Inicializar base de datos ──────────────────────────────────────────────
if not exist "data\pizzeria.sqlite" (
    echo  Inicializando base de datos...
    call npm run db:init
    if errorlevel 1 (
        echo.
        echo  [ERROR] Fallo la inicializacion de la base de datos.
        echo.
        pause
        exit /b 1
    )
    echo  [OK] Base de datos creada.
) else (
    echo  [OK] Base de datos ya existe, se mantiene.
)
echo.

rem ── 5. Compilar la aplicacion ─────────────────────────────────────────────────
echo  [3/3] Compilando la aplicacion (puede tardar 1-2 minutos)...
echo.
call npm run build
if errorlevel 1 (
    echo.
    echo  [ERROR] Fallo la compilacion.
    echo.
    pause
    exit /b 1
)

echo.
echo  ============================================
echo   Instalacion completada exitosamente.
echo   Ya podes usar INICIAR_PIZZERIA.bat
echo  ============================================
echo.
pause

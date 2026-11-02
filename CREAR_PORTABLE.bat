@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Pizzeria Napolitana - Crear portable

rem Se puede arrastrar un archivo .sqlite sobre este .bat para incluir
rem ESA base en el portable. Sin arrastrar nada, usa data\pizzeria.sqlite

if "%~1"=="" (
    powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0scripts\empaquetar-portable.ps1"
) else (
    powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0scripts\empaquetar-portable.ps1" -Db "%~1"
)

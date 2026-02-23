@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Pizzeria Napolitana - Instalacion
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0scripts\construir.ps1"

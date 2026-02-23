# Pizzeria Napolitana - Script de instalacion y compilacion

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

function Write-Step { param($msg) Write-Host "  $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Fail { param($msg) Write-Host "  [ERROR] $msg" -ForegroundColor Red }

Clear-Host
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Red
Write-Host "     PIZZERIA NAPOLITANA - Instalacion" -ForegroundColor White
Write-Host "  ============================================" -ForegroundColor Red
Write-Host ""

# ── 1. Verificar Node.js ──────────────────────────────────────────────────────
Write-Step "Verificando Node.js..."
try {
    $nodeVer = & node --version 2>&1
    Write-Ok "Node.js $nodeVer detectado."
} catch {
    Write-Fail "Node.js no esta instalado."
    Write-Host ""
    Write-Host "  Descargalo desde: https://nodejs.org  (version LTS)" -ForegroundColor Yellow
    Write-Host "  Luego REINICIA la computadora y vuelve a ejecutar CONSTRUIR.bat." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "  Presiona Enter para salir"
    exit 1
}
Write-Host ""

# ── 2. Crear .env.local si no existe ─────────────────────────────────────────
Write-Step "[1/3] Configurando base de datos..."
$envFile = Join-Path $root ".env.local"
if (-not (Test-Path $envFile)) {
    Set-Content -Path $envFile -Value "SQLITE_DB_PATH=data/pizzeria.sqlite"
    Write-Ok ".env.local creado."
} else {
    Write-Ok ".env.local ya existe, se mantiene."
}
Write-Host ""

# ── 3. Instalar dependencias ──────────────────────────────────────────────────
Write-Step "[2/3] Instalando dependencias (puede tardar unos minutos)..."
Write-Host ""
Set-Location $root
& npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Fail "Fallo la instalacion de dependencias."
    Write-Host "  Revisa tu conexion a internet e intenta de nuevo." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "  Presiona Enter para salir"
    exit 1
}
Write-Host ""
Write-Ok "Dependencias instaladas."
Write-Host ""

# ── 4. Inicializar base de datos ──────────────────────────────────────────────
$dbPath = Join-Path $root "data\pizzeria.sqlite"
if (-not (Test-Path $dbPath)) {
    Write-Step "Inicializando base de datos..."
    & npm run db:init
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Fail "Fallo la inicializacion de la base de datos."
        Write-Host ""
        Read-Host "  Presiona Enter para salir"
        exit 1
    }
    Write-Ok "Base de datos creada."
} else {
    Write-Ok "Base de datos ya existe, se mantiene."
}
Write-Host ""

# ── 5. Compilar la aplicacion ─────────────────────────────────────────────────
Write-Step "[3/3] Compilando la aplicacion (puede tardar 1-2 minutos)..."
Write-Host ""
& npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Fail "Fallo la compilacion."
    Write-Host ""
    Read-Host "  Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   Instalacion completada exitosamente." -ForegroundColor Green
Write-Host "   Ya podes usar INICIAR_PIZZERIA.bat" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Read-Host "  Presiona Enter para salir"

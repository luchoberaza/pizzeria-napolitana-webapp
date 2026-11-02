# Pizzeria Napolitana - Empaquetador del portable
# Genera dist\PizzeriaNapolitana-Portable: una carpeta autocontenida que corre
# en cualquier Windows 64 bits sin instalar Node.js ni compilar nada.
#
# Uso:
#   .\empaquetar-portable.ps1                 -> incluye data\pizzeria.sqlite del proyecto
#   .\empaquetar-portable.ps1 -Db "C:\x.sqlite" -> incluye esa base en su lugar
#
# La base queda DENTRO del ZIP, asi que el portable es un unico archivo
# listo para usar en la otra PC.

param([string]$Db = "")

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

function Write-Step { param($msg) Write-Host "  $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  [AVISO] $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "  [ERROR] $msg" -ForegroundColor Red }
# Pausa que no rompe si el script corre sin consola interactiva
function Pausa { try { Read-Host "  Presiona Enter para salir" | Out-Null } catch { } }

Clear-Host
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Red
Write-Host "     PIZZERIA NAPOLITANA - Crear portable" -ForegroundColor White
Write-Host "  ============================================" -ForegroundColor Red
Write-Host ""

# La version de Node del portable DEBE coincidir con la que compilo
# better-sqlite3, porque el .node nativo esta atado al ABI de esa version.
$nodeVersion = (& node --version).Trim()   # ej: v24.12.0
Write-Ok "Node local: $nodeVersion (sera la version embebida en el portable)"
Write-Host ""

$dist    = Join-Path $root "dist"
$outName = "PizzeriaNapolitana-Portable"
$out     = Join-Path $dist $outName

# --- 1. Dependencias -------------------------------------------------------
if (-not (Test-Path (Join-Path $root "node_modules"))) {
    Write-Step "[1/6] Instalando dependencias..."
    Set-Location $root
    & npm install
    if ($LASTEXITCODE -ne 0) { Write-Fail "Fallo npm install."; Pausa; exit 1 }
} else {
    Write-Ok "[1/6] Dependencias ya instaladas."
}
Write-Host ""

# --- 2. Build standalone ---------------------------------------------------
Write-Step "[2/6] Compilando en modo standalone (1-2 minutos)..."
Write-Host ""
Set-Location $root
$env:PORTABLE_BUILD = "1"
& npm run build
$buildCode = $LASTEXITCODE
Remove-Item Env:\PORTABLE_BUILD -ErrorAction SilentlyContinue
if ($buildCode -ne 0) { Write-Fail "Fallo la compilacion."; Pausa; exit 1 }

$standalone = Join-Path $root ".next\standalone"
if (-not (Test-Path (Join-Path $standalone "server.js"))) {
    Write-Fail "No se genero .next\standalone\server.js"
    Pausa; exit 1
}
Write-Host ""
Write-Ok "Compilacion lista."
Write-Host ""

# --- 3. Armar la carpeta del portable --------------------------------------
Write-Step "[3/6] Armando la carpeta del portable..."

if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Path $out -Force | Out-Null

$appDir = Join-Path $out "app"
New-Item -ItemType Directory -Path $appDir -Force | Out-Null

# Servidor standalone (server.js + node_modules minimo + .next/server)
Copy-Item (Join-Path $standalone "*") -Destination $appDir -Recurse -Force

# Assets que Next NO copia solo al standalone
Copy-Item (Join-Path $root ".next\static") -Destination (Join-Path $appDir ".next\static") -Recurse -Force
if (Test-Path (Join-Path $root "public")) {
    Copy-Item (Join-Path $root "public") -Destination (Join-Path $appDir "public") -Recurse -Force
}

# better-sqlite3 es nativo: me aseguro de que el .node viaje si el trace lo omitio
$bsDest = Join-Path $appDir "node_modules\better-sqlite3"
if (-not (Test-Path (Join-Path $bsDest "build\Release\better_sqlite3.node"))) {
    Write-Step "  Copiando better-sqlite3 nativo a mano..."
    if (Test-Path $bsDest) { Remove-Item $bsDest -Recurse -Force }
    Copy-Item (Join-Path $root "node_modules\better-sqlite3") -Destination $bsDest -Recurse -Force
    foreach ($dep in @("bindings", "file-uri-to-path")) {
        $depSrc = Join-Path $root "node_modules\$dep"
        $depDst = Join-Path $appDir "node_modules\$dep"
        if ((Test-Path $depSrc) -and -not (Test-Path $depDst)) {
            Copy-Item $depSrc -Destination $depDst -Recurse -Force
        }
    }
}
if (-not (Test-Path (Join-Path $bsDest "build\Release\better_sqlite3.node"))) {
    Write-Fail "No se encontro better_sqlite3.node. El portable no podria abrir la base de datos."
    Pausa; exit 1
}

# Esquema + inicializador, para que el portable pueda crear la DB si falta
$sqlDir = Join-Path $out "sql"
New-Item -ItemType Directory -Path $sqlDir -Force | Out-Null
Copy-Item (Join-Path $root "scripts\001-create-tables-sqlite.sql") -Destination $sqlDir -Force

$dataDir = Join-Path $out "data"
New-Item -ItemType Directory -Path $dataDir -Force | Out-Null

# --- Base de datos incluida en el ZIP --------------------------------------
# Asi el portable es UN solo archivo: se descomprime y ya tiene los datos.
$dbOrigen = if ($Db) { $Db } else { Join-Path $root "data\pizzeria.sqlite" }

if (Test-Path $dbOrigen) {
    # Verificar que sea realmente una base SQLite y no otra cosa
    $cabecera = [System.IO.File]::ReadAllBytes($dbOrigen)[0..14]
    $texto    = [System.Text.Encoding]::ASCII.GetString($cabecera)
    if ($texto -ne "SQLite format 3") {
        Write-Fail "El archivo no es una base SQLite valida: $dbOrigen"
        Pausa; exit 1
    }

    # Si hay -wal/-shm la app quedo abierta: podrian faltar datos sin volcar
    foreach ($sufijo in @("-wal", "-shm")) {
        if (Test-Path ($dbOrigen + $sufijo)) {
            Write-Warn "Existe $(Split-Path $dbOrigen -Leaf)$sufijo : cerra la pizzeria antes de empaquetar"
        }
    }

    Copy-Item $dbOrigen -Destination (Join-Path $dataDir "pizzeria.sqlite") -Force
    $dbKb   = [math]::Round((Get-Item $dbOrigen).Length / 1KB, 0)
    $dbFecha = (Get-Item $dbOrigen).LastWriteTime.ToString("dd/MM/yyyy HH:mm")
    Write-Ok "Base incluida en el ZIP ($dbKb KB, del $dbFecha)"
    Write-Host "       origen: $dbOrigen" -ForegroundColor DarkGray
} else {
    Write-Warn "No se encontro base de datos en: $dbOrigen"
    Write-Warn "El portable arrancara con una base vacia."
}

Write-Ok "Carpeta armada."
Write-Host ""

# --- 4. Node.js embebido ---------------------------------------------------
Write-Step "[4/6] Descargando Node.js $nodeVersion embebido (~86 MB)..."
$runtime  = Join-Path $out "runtime"
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
$nodeDest = Join-Path $runtime "node.exe"
$cache    = Join-Path $dist "node-$nodeVersion.exe"

if (Test-Path $cache) {
    Write-Ok "Usando descarga cacheada."
    Copy-Item $cache -Destination $nodeDest -Force
} else {
    $url = "https://nodejs.org/dist/$nodeVersion/win-x64/node.exe"
    try {
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $url -OutFile $nodeDest -UseBasicParsing
        Copy-Item $nodeDest -Destination $cache -Force
    } catch {
        Write-Fail "No se pudo descargar Node.js desde $url"
        Write-Host "  Revisa tu conexion a internet." -ForegroundColor Yellow
        Pausa; exit 1
    }
}
Write-Ok "Node.js embebido listo."
Write-Host ""

# --- 5. Lanzadores ---------------------------------------------------------
Write-Step "[5/6] Escribiendo lanzadores..."
Copy-Item (Join-Path $root "scripts\portable\INICIAR_PIZZERIA.bat") -Destination $out -Force
Copy-Item (Join-Path $root "scripts\portable\LEEME.txt")            -Destination $out -Force
Copy-Item (Join-Path $root "scripts\portable\iniciar.ps1")          -Destination (Join-Path $out "runtime") -Force
Copy-Item (Join-Path $root "scripts\portable\init-db.mjs")          -Destination (Join-Path $out "runtime") -Force
Write-Ok "Lanzadores listos."
Write-Host ""

# --- 6. ZIP ----------------------------------------------------------------
Write-Step "[6/6] Comprimiendo en ZIP..."
$zip = Join-Path $dist "$outName.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
$ProgressPreference = 'SilentlyContinue'
Compress-Archive -Path $out -DestinationPath $zip -CompressionLevel Optimal
$zipMb = [math]::Round((Get-Item $zip).Length / 1MB, 1)
Write-Ok "ZIP creado ($zipMb MB)."
Write-Host ""

Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   PORTABLE LISTO" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "   Llevate ESTE archivo, es lo unico que necesitas:" -ForegroundColor White
Write-Host ""
Write-Host "     $zip" -ForegroundColor Cyan
Write-Host ""
Write-Host "   En la otra PC:" -ForegroundColor Yellow
Write-Host "     1. Descomprimirlo en  C:\PizzeriaNapolitana" -ForegroundColor Yellow
Write-Host "     2. Doble clic en INICIAR_PIZZERIA.bat" -ForegroundColor Yellow
Write-Host ""
if (Test-Path (Join-Path $dataDir "pizzeria.sqlite")) {
    Write-Host "   La base de datos ya va incluida adentro." -ForegroundColor Green
} else {
    Write-Host "   OJO: va SIN base de datos (arranca vacia)." -ForegroundColor Red
}
Write-Host ""
Pausa

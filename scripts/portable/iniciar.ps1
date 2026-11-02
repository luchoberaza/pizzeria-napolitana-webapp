# Pizzeria Napolitana - Launcher del portable
# Arranca el servidor con el Node.js embebido y abre la app en su propia ventana.
# No requiere Node.js instalado en la PC.

$ErrorActionPreference = 'SilentlyContinue'

$runtime = $PSScriptRoot
$root    = Split-Path -Parent $runtime
$appDir  = Join-Path $root "app"
$nodeExe = Join-Path $runtime "node.exe"
$dbPath  = Join-Path $root "data\pizzeria.sqlite"
$logFile = Join-Path $root "servidor.log"

function Write-Step { param($msg) Write-Host "  $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "  $msg" -ForegroundColor Red }

Clear-Host
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Red
Write-Host "     PIZZERIA NAPOLITANA" -ForegroundColor White
Write-Host "  ============================================" -ForegroundColor Red
Write-Host ""

# -- 1. Base de datos -------------------------------------------------------
New-Item -ItemType Directory -Path (Join-Path $root "data") -Force -ErrorAction SilentlyContinue | Out-Null

$dbNueva = -not (Test-Path $dbPath)

# Se corre siempre: crea la base si falta y, si le copiaste una base de una
# version anterior, le agrega las tablas y columnas que le falten.
# Todo el esquema es CREATE TABLE IF NOT EXISTS, asi que repetirlo no borra nada.
if ($dbNueva) { Write-Step "Primera vez: creando base de datos..." }
else          { Write-Step "Verificando base de datos..." }

$env:SQLITE_DB_PATH = $dbPath
$initSalida = & $nodeExe (Join-Path $runtime "init-db.mjs") 2>&1

if (-not (Test-Path $dbPath)) {
    Write-Fail "No se pudo preparar la base de datos."
    Write-Host ""
    $initSalida | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
    Write-Host ""
    Read-Host "  Presiona Enter para salir"
    exit 1
}

if ($dbNueva) {
    Write-Ok "Base de datos creada (vacia)."
    Write-Warn "Copia tu pizzeria.sqlite dentro de la carpeta data\ para usar tus datos."
} else {
    Write-Ok "Base de datos lista."
}
Write-Host ""

# -- 2. Buscar un puerto libre ----------------------------------------------
function Test-PortLibre {
    param([int]$puerto)
    $listener = $null
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $puerto)
        $listener.Start()
        return $true
    } catch {
        return $false
    } finally {
        if ($listener) { $listener.Stop() }
    }
}

$port = 0
foreach ($p in 3000..3020) {
    if (Test-PortLibre $p) { $port = $p; break }
}
if ($port -eq 0) {
    Write-Fail "No hay puertos libres entre 3000 y 3020."
    Write-Host ""
    Read-Host "  Presiona Enter para salir"
    exit 1
}

# -- 3. Arrancar el servidor ------------------------------------------------
Write-Step "Encendiendo motor..."

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName               = $nodeExe
$psi.Arguments              = "server.js"
$psi.WorkingDirectory       = $appDir
$psi.UseShellExecute        = $false
$psi.CreateNoWindow         = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError  = $true
$psi.EnvironmentVariables["NODE_ENV"]       = "production"
$psi.EnvironmentVariables["PORT"]           = "$port"
$psi.EnvironmentVariables["HOSTNAME"]       = "127.0.0.1"
$psi.EnvironmentVariables["SQLITE_DB_PATH"] = $dbPath
$psi.EnvironmentVariables["PROJECT_ROOT"]   = $root

$server = [System.Diagnostics.Process]::Start($psi)

if (-not $server) {
    Write-Fail "No se pudo iniciar el servidor."
    Write-Host ""
    Read-Host "  Presiona Enter para salir"
    exit 1
}

# Volcar la salida del servidor a un log, para poder diagnosticar si algo falla
Remove-Item $logFile -Force -ErrorAction SilentlyContinue
$sbOut = { if ($EventArgs.Data) { Add-Content -Path $Event.MessageData -Value $EventArgs.Data } }
Register-ObjectEvent -InputObject $server -EventName OutputDataReceived -Action $sbOut -MessageData $logFile | Out-Null
Register-ObjectEvent -InputObject $server -EventName ErrorDataReceived  -Action $sbOut -MessageData $logFile | Out-Null
$server.BeginOutputReadLine()
$server.BeginErrorReadLine()

# -- 4. Esperar a que responda ----------------------------------------------
Write-Host "  Esperando que el servidor este listo" -NoNewline -ForegroundColor Cyan

$url      = "http://127.0.0.1:$port"
$ready    = $false
$deadline = [DateTime]::Now.AddSeconds(90)

while (-not $ready -and [DateTime]::Now -lt $deadline) {
    if ($server.HasExited) { break }
    Start-Sleep -Milliseconds 800
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
        if ($resp.StatusCode -lt 500) { $ready = $true }
    } catch { }
    if (-not $ready) { Write-Host "." -NoNewline -ForegroundColor DarkGray }
}

Write-Host ""

if (-not $ready) {
    Write-Fail "El servidor no arranco."
    if (Test-Path $logFile) {
        Write-Host ""
        Write-Warn "Detalle del error (tambien guardado en servidor.log):"
        Get-Content $logFile -Tail 15 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
    }
    if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
    Write-Host ""
    Read-Host "  Presiona Enter para salir"
    exit 1
}

Write-Ok "Servidor listo."
Write-Host ""

# -- 5. Abrir la app en ventana propia --------------------------------------
$navegadores = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$navegador = $navegadores | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($navegador) {
    Write-Step "Abriendo Pizzeria Napolitana..."
    Start-Process -FilePath $navegador -ArgumentList "--app=$url", "--window-size=1400,880"
} else {
    Write-Warn "Abriendo en el navegador predeterminado."
    Start-Process $url
}

# -- 6. Mantener vivo hasta que el usuario cierre ----------------------------
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   PIZZERIA EN LINEA" -ForegroundColor White
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  La aplicacion esta corriendo en $url" -ForegroundColor White
Write-Host "  Cuando termines de usar la pizzeria:" -ForegroundColor White
Write-Host ""
Write-Host "    * Cierra la ventana de la pizzeria, y luego" -ForegroundColor Yellow
Write-Host "    * Presiona ENTER aqui para apagar el motor." -ForegroundColor Yellow
Write-Host ""

Read-Host "  [ Presiona ENTER para apagar el servidor ]" | Out-Null

# -- 7. Apagar --------------------------------------------------------------
Write-Host ""
Write-Warn "Apagando servidor..."

if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
}

Write-Ok "Servidor apagado. Hasta luego!"
Start-Sleep -Milliseconds 1200

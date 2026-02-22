# Pizzeria Napolitana - Launcher
# Inicia el servidor Next.js y abre la app en una ventana independiente (Edge --app).
# Requiere: Node.js instalado, npm install y npm run build ejecutados previamente.

$ErrorActionPreference = 'SilentlyContinue'

# El script vive en scripts/, subir un nivel para llegar al root del proyecto
$root = Split-Path -Parent $PSScriptRoot

# Colores en consola
function Write-Step  { param($msg) Write-Host "  $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "  $msg" -ForegroundColor Red }

Clear-Host
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Red
Write-Host "     PIZZERIA NAPOLITANA" -ForegroundColor White
Write-Host "  ============================================" -ForegroundColor Red
Write-Host ""

# ── 1. Verificar que la app esta compilada ────────────────────────────────────
if (-not (Test-Path (Join-Path $root ".next\BUILD_ID"))) {
    Write-Fail "La aplicacion no esta compilada."
    Write-Fail "Ejecuta CONSTRUIR.bat primero (solo hace falta una vez)."
    Write-Host ""
    Read-Host "  Presiona Enter para salir"
    exit 1
}

# ── 2. Liberar el puerto 3000 si hay algo colgado de antes ───────────────────
$portInUse = netstat -ano 2>$null | Select-String "TCP.*:3000\s.*LISTENING"
if ($portInUse) {
    Write-Warn "El puerto 3000 estaba ocupado, liberando..."
    $portInUse | ForEach-Object {
        $pid_ = ($_ -split '\s+')[-1]
        if ($pid_ -match '^\d+$') {
            Stop-Process -Id ([int]$pid_) -Force
        }
    }
    Start-Sleep -Milliseconds 600
}

# ── 3. Arrancar el servidor Next.js en background ─────────────────────────────
Write-Step "Encendiendo motor..."

$nextCmd = Join-Path $root "node_modules\.bin\next.cmd"
if (-not (Test-Path $nextCmd)) {
    Write-Fail "No se encontro Next.js en node_modules."
    Write-Fail "Ejecuta CONSTRUIR.bat primero."
    Write-Host ""
    Read-Host "  Presiona Enter para salir"
    exit 1
}

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName        = $nextCmd
$psi.Arguments       = "start"
$psi.WorkingDirectory = $root
$psi.WindowStyle     = [System.Diagnostics.ProcessWindowStyle]::Hidden
$psi.UseShellExecute = $true   # necesario para WindowStyle Hidden con .cmd

$server = [System.Diagnostics.Process]::Start($psi)

if (-not $server) {
    Write-Fail "No se pudo iniciar el servidor."
    Write-Host ""
    Read-Host "  Presiona Enter para salir"
    exit 1
}

# ── 4. Esperar hasta que el servidor responda ─────────────────────────────────
Write-Host "  Esperando que el servidor este listo" -NoNewline -ForegroundColor Cyan

$ready    = $false
$deadline = [DateTime]::Now.AddSeconds(90)

while (-not $ready -and [DateTime]::Now -lt $deadline) {
    Start-Sleep -Milliseconds 800
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 2
        if ($resp.StatusCode -lt 500) { $ready = $true }
    } catch { }
    if (-not $ready) { Write-Host "." -NoNewline -ForegroundColor DarkGray }
}

Write-Host ""

if (-not $ready) {
    Write-Fail "El servidor no respondio en 90 segundos."
    Write-Fail "Puede que la compilacion este incompleta. Ejecuta CONSTRUIR.bat de nuevo."
    if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
    Write-Host ""
    Read-Host "  Presiona Enter para salir"
    exit 1
}

Write-Ok "Servidor listo."
Write-Host ""

# ── 5. Abrir la app en Edge modo --app (ventana independiente sin pestanas) ───
$edgePaths = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
)

$edgeExe = $edgePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($edgeExe) {
    Write-Step "Abriendo Pizzeria Napolitana..."
    Start-Process -FilePath $edgeExe -ArgumentList "--app=http://127.0.0.1:3000", "--window-size=1400,880"
} else {
    Write-Warn "Edge no encontrado. Abriendo en el navegador predeterminado."
    Write-Warn "(En Windows 10/11 Edge siempre deberia estar disponible)"
    Start-Process "http://127.0.0.1:3000"
}

# ── 6. Mantener el servidor corriendo hasta que el usuario decida salir ──────
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   PIZZERIA EN LINEA" -ForegroundColor White
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  La aplicacion esta corriendo en segundo plano." -ForegroundColor White
Write-Host "  Cuando termines de usar la pizzeria:" -ForegroundColor White
Write-Host ""
Write-Host "    * Cierra la ventana de la pizzeria, y luego" -ForegroundColor Yellow
Write-Host "    * Presiona ENTER aqui para apagar el motor." -ForegroundColor Yellow
Write-Host ""

Read-Host "  [ Presiona ENTER para apagar el servidor ]" | Out-Null

# ── 7. Apagar el servidor ─────────────────────────────────────────────────────
Write-Host ""
Write-Warn "Apagando servidor..."

if ($server -and -not $server.HasExited) {
    # Matar el arbol de procesos completo (el .cmd genera procesos hijos)
    $children = Get-WmiObject Win32_Process | Where-Object { $_.ParentProcessId -eq $server.Id }
    foreach ($child in $children) {
        Stop-Process -Id $child.ProcessId -Force
    }
    Stop-Process -Id $server.Id -Force
}

Write-Ok "Servidor apagado. Hasta luego!"
Start-Sleep -Milliseconds 1200

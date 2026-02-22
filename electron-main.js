/**
 * Electron entry point – Pizzeria Napolitana
 *
 * Flow:
 *  1. Show a splash window with a loading animation.
 *  2. Spawn `npm start` (Next.js production server) as a child process.
 *  3. Poll http://127.0.0.1:3000 until the server responds.
 *  4. Open the main BrowserWindow, close the splash.
 *  5. On main-window close → kill the server → quit Electron.
 */

const { app, BrowserWindow, dialog, shell } = require('electron')
const { spawn }  = require('child_process')
const http       = require('http')
const path       = require('path')
const fs         = require('fs')

// ─── Constants ──────────────────────────────────────────────────────────────
const PORT        = 3000
const APP_URL     = `http://127.0.0.1:${PORT}`
const PROJECT_ROOT = __dirname
const MAX_WAIT_MS = 90_000   // 90 s max wait for the server to be ready

// ─── State ───────────────────────────────────────────────────────────────────
let serverProcess = null
let mainWindow    = null
let splashWindow  = null
let serverReady   = false

// ─── Splash window ───────────────────────────────────────────────────────────
function createSplashWindow () {
  splashWindow = new BrowserWindow({
    width:           460,
    height:          280,
    frame:           false,
    resizable:       false,
    center:          true,
    alwaysOnTop:     true,
    backgroundColor: '#B3261E',
    webPreferences:  { nodeIntegration: false, contextIsolation: true }
  })

  splashWindow.loadURL(`data:text/html;charset=utf-8,<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    background:#B3261E;display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    height:100vh;font-family:'Segoe UI',Arial,sans-serif;color:#fff;
    user-select:none;
  }
  .emoji{font-size:56px;margin-bottom:16px}
  h1{font-size:26px;font-weight:700;letter-spacing:.5px}
  p{margin-top:10px;font-size:13px;opacity:.75}
  .dots{display:inline-flex;gap:4px;margin-left:4px}
  .dot{width:6px;height:6px;border-radius:50%;background:#fff;opacity:0;
       animation:pulse 1.4s infinite}
  .dot:nth-child(2){animation-delay:.2s}
  .dot:nth-child(3){animation-delay:.4s}
  @keyframes pulse{0%,80%,100%{opacity:0}40%{opacity:1}}
</style>
</head>
<body>
  <div class="emoji">🍕</div>
  <h1>Pizzeria Napolitana</h1>
  <p>Iniciando sistema<span class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span></p>
</body>
</html>`)
}

// ─── Main window ─────────────────────────────────────────────────────────────
function createMainWindow () {
  mainWindow = new BrowserWindow({
    width:           1360,
    height:          860,
    minWidth:        960,
    minHeight:       620,
    title:           'Pizzeria Napolitana',
    backgroundColor: '#f7f7f7',
    show:            false,
    webPreferences:  { nodeIntegration: false, contextIsolation: true }
  })

  // Remove the native menu bar (File / Edit / View / …)
  mainWindow.setMenuBarVisibility(false)

  // Open external links in the system browser, not inside the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.loadURL(APP_URL)

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close()
      splashWindow = null
    }
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    killServer()
    app.quit()
  })
}

// ─── Server management ───────────────────────────────────────────────────────
function startServer () {
  return new Promise((resolve, reject) => {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'

    serverProcess = spawn(npmCmd, ['start'], {
      cwd:   PROJECT_ROOT,
      env:   { ...process.env, PROJECT_ROOT },
      shell: true,
      // Pipe output so we can log it; don't inherit so the terminal stays clean
      stdio: ['ignore', 'pipe', 'pipe']
    })

    serverProcess.stdout.on('data', d => process.stdout.write(`[server] ${d}`))
    serverProcess.stderr.on('data', d => process.stderr.write(`[server] ${d}`))

    serverProcess.on('error', err => {
      reject(new Error(`No se pudo iniciar el servidor: ${err.message}`))
    })

    serverProcess.on('exit', (code, signal) => {
      // If the server exits unexpectedly after the app was already up, alert.
      if (serverReady && mainWindow && !mainWindow.isDestroyed()) {
        dialog.showErrorBox(
          'Error del servidor',
          `El servidor se cerró inesperadamente (código ${code}).`
        )
        app.quit()
      }
    })

    // Poll until the server responds
    const started = Date.now()
    const timer = setInterval(() => {
      if (Date.now() - started > MAX_WAIT_MS) {
        clearInterval(timer)
        reject(new Error(
          `El servidor tardó más de ${MAX_WAIT_MS / 1000} segundos en responder.\n` +
          'Revisá que la compilación esté completa (CONSTRUIR.bat).'
        ))
        return
      }

      http.get(APP_URL, res => {
        // Any non-5xx response means the server is alive
        if (res.statusCode < 500) {
          res.resume()
          clearInterval(timer)
          serverReady = true
          resolve()
        }
      }).on('error', () => { /* still starting… */ })
    }, 800)
  })
}

function killServer () {
  if (!serverProcess) return
  try {
    // On Windows, spawning with shell:true creates a cmd.exe wrapper; kill the
    // whole process tree to avoid orphaned node processes.
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(serverProcess.pid), '/T', '/F'], { shell: true })
    } else {
      serverProcess.kill('SIGTERM')
    }
  } catch (_) { /* ignore */ }
  serverProcess = null
}

// ─── App lifecycle ───────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Verify the app is built before trying to start
  if (!fs.existsSync(path.join(PROJECT_ROOT, '.next', 'BUILD_ID'))) {
    dialog.showErrorBox(
      'App no compilada',
      'No se encontró la compilación de la aplicación.\n\n' +
      'Ejecutá CONSTRUIR.bat primero y luego volvé a abrir la pizzería.'
    )
    app.quit()
    return
  }

  createSplashWindow()

  try {
    await startServer()
    createMainWindow()
  } catch (err) {
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close()
    dialog.showErrorBox('Error al iniciar', err.message)
    killServer()
    app.quit()
  }
})

app.on('window-all-closed', () => {
  killServer()
  app.quit()
})

app.on('before-quit', () => {
  killServer()
})

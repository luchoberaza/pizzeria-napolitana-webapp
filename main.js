const { app, BrowserWindow } = require("electron")
const path = require("path")
const { fork } = require("child_process")
const isDev = require("electron-is-dev")

let mainWindow
let serverProcess

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, "public/logo.png"),
        title: "Pizzeria Napolitana",
    })

    // In production, we start the next server
    if (!isDev) {
        const nextStartScript = path.join(__dirname, "node_modules/next/dist/bin/next")
        serverProcess = fork(nextStartScript, ["start"], {
            cwd: __dirname,
            env: { ...process.env, NODE_ENV: "production", PORT: "3000" },
        })

        // Wait for server to be ready before loading the URL
        // A better way is to probe the port, but for now we wait a bit
        setTimeout(() => {
            mainWindow.loadURL("http://localhost:3000")
        }, 3000)
    } else {
        mainWindow.loadURL("http://localhost:3000")
    }

    mainWindow.on("closed", () => {
        mainWindow = null
    })

    // Remove default menu
    mainWindow.setMenu(null)
}

app.on("ready", createWindow)

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        if (serverProcess) serverProcess.kill()
        app.quit()
    }
})

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow()
    }
})

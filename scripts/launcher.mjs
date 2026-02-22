import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PORT = 3000;
const URL = `http://127.0.0.1:${PORT}`;

console.log('==========================================');
console.log('   INICIANDO PIZZERIA NAPOLITANA (v4)');
console.log('==========================================');
console.log(`Directorio Raiz: ${PROJECT_ROOT}\n`);

// 1. Iniciar el servidor Next.js en la MISMA ventana
console.log('[1/2] Encendiendo motor...');

const server = spawn('npm.cmd', ['start'], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, PROJECT_ROOT: PROJECT_ROOT },
    stdio: 'inherit', // Esto hace que los logs aparezcan aqui mismo!
    shell: true
});

server.on('error', (err) => {
    console.error('\n[ERROR CRITICO] No se pudo iniciar el proceso:', err.message);
    process.exit(1);
});

// 2. Monitorear el puerto en segundo plano para abrir Edge cuando este listo
const waitForServer = () => {
    const timer = setInterval(() => {
        http.get(URL, (res) => {
            if (res.statusCode === 200) {
                clearInterval(timer);
                console.log('\n[SISTEMA] Motor listo. Abriendo aplicacion...');

                // Abrir Edge
                const openCmd = `start msedge --app=${URL}`;
                spawn('cmd.exe', ['/c', openCmd], { detached: true, stdio: 'ignore' });

                console.log('\n------------------------------------------');
                console.log('   PIZZERIA EN LINEA');
                console.log('------------------------------------------');
                console.log('Usa el programa normalmente. Cierra esta ventana para apagar el motor.\n');
            }
        }).on('error', () => {
            // Seguir esperando
        });
    }, 2000);
};

waitForServer();

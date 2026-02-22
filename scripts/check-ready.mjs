import http from 'http';

const MAX_WAIT_MS = 30000; // 30 seconds
const START_TIME = Date.now();

const checkServer = () => {
    if (Date.now() - START_TIME > MAX_WAIT_MS) {
        console.error('\n[ERROR] El servidor tardó demasiado en responder.');
        process.exit(1);
    }

    process.stdout.write('.');
    http.get('http://127.0.0.1:3000', (res) => {
        if (res.statusCode === 200) {
            console.log('\n[OK] Servidor detectado.');
            process.exit(0);
        } else {
            setTimeout(checkServer, 500);
        }
    }).on('error', () => {
        setTimeout(checkServer, 500);
    });
};

console.log('Verificando conexión local (pueden ser 15-20s la primera vez)...');
checkServer();

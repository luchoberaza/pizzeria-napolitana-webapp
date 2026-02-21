import http from 'http';

const MAX_RETRIES = 60; // 30 seconds total
let retries = 0;

const checkServer = () => {
    process.stdout.write('.');
    http.get('http://127.0.0.1:3000', (res) => {
        if (res.statusCode === 200) {
            console.log('\n[OK] Servidor detectado.');
            process.exit(0);
        } else {
            retry();
        }
    }).on('error', () => {
        retry();
    });
};

const retry = () => {
    retries++;
    if (retries > MAX_RETRIES) {
        console.error('\n[ERROR] El servidor está tardando demasiado en responder.');
        console.error('Asegúrate de haber ejecutado "CONSTRUIR_PROGRAMA.bat" primero.');
        console.error('También verifica que no haya otro programa usando el puerto 3000.');
        process.exit(1);
    }
    setTimeout(checkServer, 500);
};

console.log('Verificando conexión local (esto puede tardar unos segundos)...');
checkServer();

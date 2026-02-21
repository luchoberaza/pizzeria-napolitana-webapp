import http from 'http';

const checkServer = () => {
    http.get('http://localhost:3000', (res) => {
        if (res.statusCode === 200) {
            process.exit(0);
        } else {
            setTimeout(checkServer, 500);
        }
    }).on('error', () => {
        setTimeout(checkServer, 500);
    });
};

console.log('Verificando conexión local...');
checkServer();

import http from 'http';
import { app } from './app';
import logger from './tools/logger';
import { initMailer } from './tools/mailer';
import process from 'process';

const port = normalizePort(process.env.PORT ?? '8080');
app.set('port', port);

const server = http.createServer(app);

server.on('error', errorHandler);
server.on('listening', () => {
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + String(address) : 'port ' + String(port);
    console.log('Listening on ' + bind);
});

function main () {
    logger.setupLogging();
    checkEnvVariables();
    initMailer()
        .then(startServer)
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

main();

function checkEnvVariables () {
    const vars = ['NODE_ENV', 'WEBSITE_URL', 'WEBSITE_NAME', 'FAVICON_URL'];

    for (const v of vars) {
        if (process.env[v] === undefined || process.env[v] === '') {
            console.error(v + ' environment variable is not set.');
            process.exit(1);
        }
    }
}

function normalizePort (val: string) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }

    if (port >= 0) {
        return port;
    }

    return false;
}

function errorHandler (error: NodeJS.ErrnoException) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + String(address) : 'port: ' + String(port);
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges.');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use.');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function startServer () {
    server.listen(port);
}

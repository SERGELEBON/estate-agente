const { spawn } = require('child_process');
const path = require('path');

function startServer() {
    console.log(`[${new Date().toISOString()}] Starting server...`);
    
    const server = spawn('node', [path.join(__dirname, '.next/standalone/server.js')], {
        env: { ...process.env, NODE_ENV: 'production' },
        stdio: 'inherit'
    });

    server.on('error', (err) => {
        console.error(`[${new Date().toISOString()}] Server error:`, err);
    });

    server.on('exit', (code, signal) => {
        console.log(`[${new Date().toISOString()}] Server exited with code=${code} signal=${signal}. Restarting in 2s...`);
        setTimeout(startServer, 2000);
    });
}

// Catch all uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error(`[${new Date().toISOString()}] Uncaught exception:`, err);
});

startServer();

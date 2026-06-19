const { spawn } = require('child_process');
const path = require('path');

function startServer() {
  const env = {
    ...process.env,
    PORT: '3000',
    NODE_ENV: 'production',
    NODE_OPTIONS: '--max-old-space-size=512'
  };
  
  const child = spawn('node', ['.next/standalone/server.js'], {
    cwd: '/home/z/my-project',
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });
  
  child.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  child.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  child.on('exit', (code, signal) => {
    console.log(`Server exited with code ${code}, signal ${signal}. Restarting in 3s...`);
    setTimeout(startServer, 3000);
  });
  
  console.log(`Server started with PID ${child.pid}`);
}

startServer();

// Keep the process alive
process.on('SIGTERM', () => { /* ignore */ });
process.on('SIGINT', () => { /* ignore */ });

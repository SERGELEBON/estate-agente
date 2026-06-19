module.exports = {
  apps: [{
    name: "state-immocom",
    script: "./.next/standalone/server.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    max_restarts: 10,
    restart_delay: 5000,
    autorestart: true,
    watch: false
  }]
};

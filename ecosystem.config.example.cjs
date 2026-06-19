module.exports = {
  apps: [
    {
      name: "immocom",
      script: "node .next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        DATABASE_URL: "file:/path/to/db/custom.db",
        NEXTAUTH_SECRET: "GENERATE_WITH_openssl_rand_base64_32",
        NEXTAUTH_URL: "http://localhost:3000",
        AUTH_TRUST_HOST: "true",
        GOOGLE_CLIENT_ID: "your-google-client-id.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "your-google-client-secret",
      },
    },
  ],
};
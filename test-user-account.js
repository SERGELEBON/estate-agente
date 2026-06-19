#!/usr/bin/env node

const https = require('https');
const { URL } = require('url');

const BASE_URL = 'https://state-agente.vercel.app';
const credentials = {
  email: 'sala@gestionnaire.com',
  password: '01245678785'
};

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          cookies: res.headers['set-cookie'] || []
        });
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function testLogin() {
  console.log('Testing login for:', credentials.email);
  
  const csrfRes = await makeRequest(`${BASE_URL}/api/auth/csrf`);
  const csrfData = JSON.parse(csrfRes.body);
  const csrfCookie = csrfRes.cookies.find(c => c.includes('next-auth.csrf-token'));

  const formData = new URLSearchParams({
    email: credentials.email,
    password: credentials.password,
    csrfToken: csrfData.csrfToken,
    callbackUrl: `${BASE_URL}/dashboard`,
    json: 'true'
  }).toString();

  const loginRes = await makeRequest(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookie || '',
    },
    body: formData
  });

  console.log('Status:', loginRes.status);
  console.log('Response:', loginRes.body);
  
  const sessionCookie = loginRes.cookies.find(c => c.includes('next-auth.session-token'));
  if (sessionCookie) {
    const sessionRes = await makeRequest(`${BASE_URL}/api/auth/session`, {
      headers: { 'Cookie': sessionCookie }
    });
    console.log('Session:', sessionRes.body);
  } else {
    console.log('❌ No session cookie created');
  }
}

testLogin().catch(console.error);

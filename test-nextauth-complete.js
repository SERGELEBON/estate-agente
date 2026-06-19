#!/usr/bin/env node

/**
 * Complete NextAuth login test
 * Simulates exactly what the browser does
 */

const https = require('https');
const { URL } = require('url');

const BASE_URL = 'https://state-agente.vercel.app';
const credentials = {
  email: 'admin@state-immocom.com',
  password: 'Admin@2024'
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

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testLogin() {
  console.log('🧪 Testing NextAuth Complete Login Flow\n');
  console.log('========================================');

  try {
    // Step 1: Get CSRF token
    console.log('\n📋 Step 1: Getting CSRF token...');
    const csrfRes = await makeRequest(`${BASE_URL}/api/auth/csrf`);
    const csrfData = JSON.parse(csrfRes.body);
    console.log('   CSRF Token:', csrfData.csrfToken.substring(0, 20) + '...');

    const csrfCookie = csrfRes.cookies.find(c => c.includes('next-auth.csrf-token'));
    console.log('   CSRF Cookie:', csrfCookie ? '✓ Set' : '✗ Not set');

    // Step 2: Attempt login with CSRF token
    console.log('\n🔐 Step 2: Attempting login...');
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

    console.log('   Status:', loginRes.status);
    console.log('   Response:', loginRes.body);

    const sessionCookie = loginRes.cookies.find(c => c.includes('next-auth.session-token'));
    console.log('   Session Cookie:', sessionCookie ? '✓ Set' : '✗ Not set');

    // Step 3: Check if we have a session
    if (sessionCookie) {
      console.log('\n✓ Step 3: Verifying session...');
      const sessionRes = await makeRequest(`${BASE_URL}/api/auth/session`, {
        headers: { 'Cookie': sessionCookie }
      });
      console.log('   Session:', sessionRes.body);

      const session = JSON.parse(sessionRes.body);
      if (session && session.user) {
        console.log('\n✅ LOGIN SUCCESSFUL!');
        console.log('   User:', session.user.email);
        console.log('   Role:', session.user.role);
      } else {
        console.log('\n❌ LOGIN FAILED: No session created');
      }
    } else {
      console.log('\n❌ LOGIN FAILED: No session cookie');

      // Try to parse error from response
      try {
        const errorData = JSON.parse(loginRes.body);
        console.log('   Error:', errorData);
      } catch {
        console.log('   Response:', loginRes.body);
      }
    }

    console.log('\n========================================\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
  }
}

testLogin();
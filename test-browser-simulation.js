#!/usr/bin/env node

/**
 * Simule exactement ce que fait le navigateur
 */

const https = require('https');
const { URL } = require('url');

const BASE_URL = 'https://state-agente.vercel.app';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        ...options.headers
      },
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

async function fullTest() {
  console.log('🔍 DIAGNOSTIC COMPLET DE L\'AUTHENTIFICATION\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Vérifier que NextAuth répond
    console.log('\n1️⃣  Test NextAuth API...');
    const providersRes = await makeRequest(`${BASE_URL}/api/auth/providers`);
    console.log('   Status:', providersRes.status);
    const providers = JSON.parse(providersRes.body);
    console.log('   Providers:', Object.keys(providers));

    // Test 2: CSRF token
    console.log('\n2️⃣  Obtention CSRF token...');
    const csrfRes = await makeRequest(`${BASE_URL}/api/auth/csrf`);
    const csrfData = JSON.parse(csrfRes.body);
    console.log('   CSRF Token:', csrfData.csrfToken.substring(0, 30) + '...');
    const csrfCookie = csrfRes.cookies.find(c => c.includes('csrf-token'));
    console.log('   Cookie set:', !!csrfCookie);

    // Test 3: Login avec credentials
    console.log('\n3️⃣  Tentative de connexion...');
    const formData = new URLSearchParams({
      email: 'admin@state-immocom.com',
      password: 'Admin@2024',
      csrfToken: csrfData.csrfToken,
      callbackUrl: `${BASE_URL}/dashboard/admin`,
      json: 'true'
    }).toString();

    const loginRes = await makeRequest(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': csrfCookie || '',
        'Origin': BASE_URL,
        'Referer': `${BASE_URL}/auth/signin`,
      },
      body: formData
    });

    console.log('   Status:', loginRes.status);
    console.log('   Response:', loginRes.body);

    const sessionCookie = loginRes.cookies.find(c => c.includes('session-token'));
    console.log('   Session cookie créé:', !!sessionCookie);

    if (sessionCookie) {
      console.log('\n4️⃣  Vérification session...');
      const sessionRes = await makeRequest(`${BASE_URL}/api/auth/session`, {
        headers: { 'Cookie': sessionCookie }
      });
      const session = JSON.parse(sessionRes.body);
      console.log('   Session:', JSON.stringify(session, null, 2));

      if (session.user) {
        console.log('\n✅ AUTHENTIFICATION RÉUSSIE!');
        console.log('   Email:', session.user.email);
        console.log('   Role:', session.user.role);
        console.log('   ID:', session.user.id);

        // Test 5: Accès au dashboard
        console.log('\n5️⃣  Test accès dashboard...');
        const dashboardRes = await makeRequest(`${BASE_URL}/dashboard/admin`, {
          headers: {
            'Cookie': sessionCookie,
            'Accept': 'text/html'
          }
        });
        console.log('   Status:', dashboardRes.status);
        if (dashboardRes.status === 200) {
          console.log('   ✅ Accès dashboard autorisé');
        } else if (dashboardRes.status === 307 || dashboardRes.status === 302) {
          console.log('   ⚠️  Redirection vers:', dashboardRes.headers.location);
        } else {
          console.log('   ❌ Accès refusé');
        }
      } else {
        console.log('\n❌ Session vide - Pas d\'utilisateur');
      }
    } else {
      console.log('\n❌ ÉCHEC: Pas de session cookie');

      // Analyse de la réponse
      try {
        const errorData = JSON.parse(loginRes.body);
        console.log('\n   Détails de l\'erreur:');
        console.log('   ', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('\n   Réponse brute:', loginRes.body.substring(0, 200));
      }

      console.log('\n   Cookies reçus:');
      loginRes.cookies.forEach(c => console.log('   -', c.substring(0, 80)));
    }

    // Test 6: Diagnostic auth backend
    console.log('\n6️⃣  Test authentification backend directe...');
    const backendRes = await makeRequest(`${BASE_URL}/api/test-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@state-immocom.com',
        password: 'Admin@2024'
      })
    });
    const backendData = JSON.parse(backendRes.body);
    console.log('   Backend auth:', backendData.success ? '✅ OK' : '❌ FAIL');
    if (backendData.user) {
      console.log('   User trouvé:', backendData.user.email);
    }

  } catch (error) {
    console.error('\n💥 ERREUR:', error.message);
    console.error(error.stack);
  }

  console.log('\n' + '='.repeat(60));
}

fullTest();
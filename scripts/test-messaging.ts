// End-to-end test of internal messaging system
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';

async function main() {
  // ── Step 0: pick a property + agent ───────────────────────────
  const property = await prisma.property.findFirst({
    where: { status: 'AVAILABLE' },
    include: { agent: true },
  });
  if (!property) throw new Error('No property found');
  console.log(`Using property: ${property.title} (agent: ${property.agent.name})`);

  // ── Step 1: Visitor creates a conversation (no auth) ─────────
  console.log('\n--- Step 1: Visitor sends message ---');
  const r1 = await fetch(`${BASE}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitorName: 'Test Visitor',
      visitorEmail: 'test.visitor@example.com',
      visitorPhone: '+233500000000',
      subject: 'Interested in this property',
      body: 'Hello, is this still available? I would like to schedule a visit.',
      propertyId: property.id,
      agentId: property.agent.id,
    }),
  });
  if (!r1.ok) throw new Error(`Step 1 failed: ${r1.status} ${await r1.text()}`);
  const d1 = await r1.json();
  console.log(`✓ Conversation created: ${d1.conversation.id}`);
  console.log(`✓ Visitor token: ${d1.visitorToken.slice(0, 8)}...`);
  console.log(`✓ Conversation unreadForAgent: ${d1.conversation.unreadForAgent ?? '(not in response)'}`);

  // ── Step 2: Visitor fetches their conversation via magic token ─
  console.log('\n--- Step 2: Visitor fetches their conversation ---');
  const r2 = await fetch(`${BASE}/api/conversations/visitor?token=${d1.visitorToken}`);
  if (!r2.ok) throw new Error(`Step 2 failed: ${r2.status} ${await r2.text()}`);
  const d2 = await r2.json();
  console.log(`✓ Visitor fetched conversation: ${d2.conversation.id}`);
  console.log(`✓ Messages count: ${d2.conversation.messages.length}`);
  console.log(`✓ First message body: "${d2.conversation.messages[0].body}"`);

  // ── Step 3: Agent logs in and views their conversation list ────
  console.log('\n--- Step 3: Agent authenticates and views inbox ---');
  // Get CSRF token first
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrf = (await csrfRes.json()).csrfToken;
  // Set cookie jar manually
  const cookies: string[] = [];
  const extractCookies = (res: Response) => {
    const setCookies = res.headers.getSetCookie?.() ?? [];
    for (const sc of setCookies) {
      const cookiePart = sc.split(';')[0];
      cookies.push(cookiePart);
    }
  };
  extractCookies(csrfRes);

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookies.join('; '),
    },
    body: new URLSearchParams({
      csrfToken: csrf,
      email: 'kwame@state-immocom.com',
      password: 'Agent@2024',
      callbackUrl: '/',
      json: 'true',
    }),
    redirect: 'manual',
  });
  extractCookies(loginRes);
  console.log(`✓ Login status: ${loginRes.status}`);

  const r3 = await fetch(`${BASE}/api/conversations`, {
    headers: { Cookie: cookies.join('; ') },
  });
  if (!r3.ok) throw new Error(`Step 3 failed: ${r3.status} ${await r3.text()}`);
  const d3 = await r3.json();
  console.log(`✓ Agent sees ${d3.conversations.length} conversation(s), unread total: ${d3.totalUnread}`);
  const conv = d3.conversations[0];
  console.log(`✓ Latest conversation: with ${conv.visitorName} — "${conv.subject}"`);

  // ── Step 4: Agent opens the conversation and replies ──────────
  console.log('\n--- Step 4: Agent opens conversation + replies ---');
  const r4 = await fetch(`${BASE}/api/conversations/${conv.id}`, {
    headers: { Cookie: cookies.join('; ') },
  });
  if (!r4.ok) throw new Error(`Step 4a failed: ${r4.status} ${await r4.text()}`);
  const d4 = await r4.json();
  console.log(`✓ Conversation opened, messages: ${d4.conversation.messages.length}`);
  console.log(`✓ unreadForAgent after opening: ${d4.conversation.unreadForAgent}`);

  const r5 = await fetch(`${BASE}/api/conversations/${conv.id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookies.join('; ') },
    body: JSON.stringify({ body: 'Hello Test! Yes, it is still available. When would you like to visit?' }),
  });
  if (!r5.ok) throw new Error(`Step 4b failed: ${r5.status} ${await r5.text()}`);
  const d5 = await r5.json();
  console.log(`✓ Agent reply sent: "${d5.message.body}" (senderType: ${d5.message.senderType})`);

  // ── Step 5: Visitor fetches again and sees agent reply ────────
  console.log('\n--- Step 5: Visitor checks for reply ---');
  const r6 = await fetch(`${BASE}/api/conversations/visitor?token=${d1.visitorToken}`);
  const d6 = await r6.json();
  console.log(`✓ Visitor now sees ${d6.conversation.messages.length} message(s)`);
  console.log(`✓ Last message: from ${d6.conversation.messages[d6.conversation.messages.length - 1].senderType} — "${d6.conversation.messages[d6.conversation.messages.length - 1].body}"`);

  // ── Step 6: Visitor replies back ──────────────────────────────
  console.log('\n--- Step 6: Visitor sends follow-up ---');
  const r7 = await fetch(`${BASE}/api/conversations/visitor/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: d1.visitorToken,
      body: 'Great, how about tomorrow at 3pm?',
    }),
  });
  if (!r7.ok) throw new Error(`Step 6 failed: ${r7.status} ${await r7.text()}`);
  const d7 = await r7.json();
  console.log(`✓ Visitor follow-up sent: "${d7.message.body}"`);

  // ── Step 7: Check notifications endpoint ──────────────────────
  console.log('\n--- Step 7: Notifications endpoint ---');
  const r8 = await fetch(`${BASE}/api/notifications`, {
    headers: { Cookie: cookies.join('; ') },
  });
  const d8 = await r8.json();
  console.log(`✓ Notifications — unread: ${d8.unread}, total: ${d8.totalConversations}`);
  console.log(`✓ Recent unread preview: ${d8.recent.length} item(s)`);

  console.log('\n=========================================');
  console.log('✅ All end-to-end tests passed!');
  console.log('=========================================');
}

main()
  .catch((e) => { console.error('❌ TEST FAILED:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

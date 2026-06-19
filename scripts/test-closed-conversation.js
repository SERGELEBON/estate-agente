// Quick script to test the closed-conversation error path
// Run with: node scripts/test-closed-conversation.js
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

(async () => {
  const cid = process.argv[2];
  if (!cid) {
    console.error("Usage: node test-closed-conversation.js <conversationId>");
    process.exit(1);
  }
  await db.conversation.update({ where: { id: cid }, data: { closed: true } });
  console.log("Conversation", cid, "marked as closed");
  await db.$disconnect();
})();

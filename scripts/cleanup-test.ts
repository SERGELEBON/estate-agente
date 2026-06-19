import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // Delete test conversations + their messages
  const testConvs = await prisma.conversation.findMany({
    where: { visitorEmail: 'test.visitor@example.com' },
    select: { id: true },
  });
  if (testConvs.length === 0) {
    console.log('No test conversations to clean up.');
    return;
  }
  for (const c of testConvs) {
    await prisma.message.deleteMany({ where: { conversationId: c.id } });
    await prisma.conversation.delete({ where: { id: c.id } });
  }
  console.log(`✓ Deleted ${testConvs.length} test conversation(s)`);
}
main().catch(console.error).finally(() => prisma.$disconnect());

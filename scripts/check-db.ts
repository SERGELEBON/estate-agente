import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const props = await prisma.property.findMany({ select: { id: true, title: true, price: true, priceDuration: true, images: true }});
  console.log("Properties count:", props.length);
  for (const p of props) console.log(JSON.stringify({id:p.id, title:p.title, price:p.price, dur:p.priceDuration, img:p.images?.slice(0,80)}));
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true }});
  console.log("\nUsers count:", users.length);
  for (const u of users) console.log(JSON.stringify(u));
}
main().catch(console.error).finally(() => prisma.$disconnect());

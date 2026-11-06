import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/schools/me/reviews — every review of the owner's school (hidden ones flagged)
export async function GET() {
  const me = await getSessionUser();
  if (!me || me.role !== "SCHOOL") return NextResponse.json({ error: "School accounts only" }, { status: 403 });
  const reviews = await db.schoolReview.findMany({
    where: { school: { ownerId: me.id } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, rating: true, title: true, comment: true, hidden: true, reply: true, repliedAt: true, createdAt: true,
      author: { select: { name: true, image: true } },
    },
  });
  return NextResponse.json({ reviews });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const schema = z.object({ reply: z.string().trim().max(1000) });

// POST /api/schools/me/reviews/[id]/reply — the school answers a review publicly (empty = remove)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me || me.role !== "SCHOOL") return NextResponse.json({ error: "School accounts only" }, { status: 403 });
  const { id } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Reply is too long (max 1000 characters)" }, { status: 400 });

  const review = await db.schoolReview.findFirst({ where: { id, school: { ownerId: me.id } }, select: { id: true } });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  const updated = await db.schoolReview.update({
    where: { id },
    data: { reply: parsed.data.reply || null, repliedAt: parsed.data.reply ? new Date() : null },
    select: { id: true, reply: true, repliedAt: true },
  });
  return NextResponse.json({ review: updated });
}

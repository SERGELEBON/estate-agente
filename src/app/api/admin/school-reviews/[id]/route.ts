import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { recomputeSchoolRating } from "@/lib/schools";

const schema = z.object({ hidden: z.boolean() });

// PATCH /api/admin/school-reviews/[id] { hidden } — moderate a review; rating is recomputed
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });

  const review = await db.schoolReview.findUnique({ where: { id }, select: { schoolId: true } });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  await db.$transaction(async (tx) => {
    await tx.schoolReview.update({ where: { id }, data: { hidden: parsed.data.hidden } });
    await recomputeSchoolRating(tx, review.schoolId);
  });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { recomputeSchoolRating, reviewSchema } from "@/lib/schools";

// POST /api/schools/[slug]/reviews — a signed-in client rates a school (one review each, editable).
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Sign in to leave a review.", code: "AUTH_REQUIRED" }, { status: 401 });
  if (me.role !== "CLIENT") {
    return NextResponse.json({ error: "Only learners with a client account can review schools." }, { status: 403 });
  }

  const { slug } = await params;
  const school = await db.school.findFirst({ where: { slug, status: "ACTIVE" }, select: { id: true, ownerId: true } });
  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });
  if (school.ownerId === me.id) return NextResponse.json({ error: "You can't review your own school." }, { status: 403 });

  const parsed = reviewSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid review" }, { status: 400 });
  }

  const review = await db.$transaction(async (tx) => {
    const r = await tx.schoolReview.upsert({
      where: { schoolId_authorId: { schoolId: school.id, authorId: me.id } },
      create: { schoolId: school.id, authorId: me.id, ...parsed.data },
      // Editing a review sends it back to the public list (moderation flag kept if it was hidden).
      update: { ...parsed.data },
      select: { id: true, rating: true, title: true, comment: true, createdAt: true, hidden: true },
    });
    await recomputeSchoolRating(tx, school.id);
    return r;
  });

  return NextResponse.json({ review }, { status: 201 });
}

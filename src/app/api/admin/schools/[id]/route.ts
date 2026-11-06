import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sendEmail, siteUrl } from "@/lib/email";
import { escapeHtml } from "@/lib/security";

const schema = z.object({
  status: z.enum(["PENDING_REVIEW", "ACTIVE", "SUSPENDED"]).optional(),
  featured: z.boolean().optional(),
});

// PATCH /api/admin/schools/[id] — approve / suspend / feature a school
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });

  const before = await db.school.findUnique({ where: { id }, select: { status: true } });
  if (!before) return NextResponse.json({ error: "School not found" }, { status: 404 });

  const school = await db.school.update({
    where: { id },
    data: { ...parsed.data, ...(parsed.data.status ? { reviewedAt: new Date() } : {}) },
    include: { owner: { select: { email: true } } },
  });

  if (parsed.data.status === "ACTIVE" && before.status !== "ACTIVE") {
    await sendEmail({
      to: school.owner.email,
      subject: "Your school is now live on State-ImmoCom",
      html: `<p><strong>${escapeHtml(school.name)}</strong> has been verified and is now listed.</p><p><a href="${siteUrl()}/schools/${school.slug}">See your public page</a></p>`,
    });
  }
  return NextResponse.json({ ok: true, status: school.status, featured: school.featured });
}

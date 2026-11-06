import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { schoolProfileSchema, serializeSchool, uniqueSchoolSlug } from "@/lib/schools";
import { sendEmail, siteUrl } from "@/lib/email";
import { escapeHtml } from "@/lib/security";

async function requireSchoolOwner() {
  const me = await getSessionUser();
  if (!me) return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  if (me.role !== "SCHOOL") return { error: NextResponse.json({ error: "School accounts only" }, { status: 403 }) };
  return { me };
}

// GET /api/schools/me — the owner's school (null until created) + review stats
export async function GET() {
  const { me, error } = await requireSchoolOwner();
  if (error) return error;
  const school = await db.school.findUnique({ where: { ownerId: me.id } });
  return NextResponse.json({ school: school ? serializeSchool(school) : null });
}

// PUT /api/schools/me — create or update the owner's school profile
export async function PUT(request: NextRequest) {
  const { me, error } = await requireSchoolOwner();
  if (error) return error;

  const parsed = schoolProfileSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return NextResponse.json({ error: "Please fix the highlighted fields.", fields }, { status: 400 });
  }
  const d = parsed.data;
  const data = {
    ...d,
    levels: JSON.stringify(d.levels),
    formats: JSON.stringify(d.formats),
    exams: JSON.stringify(d.exams),
    priceFrom: d.priceFrom ?? null,
  };

  const existing = await db.school.findUnique({ where: { ownerId: me.id }, select: { id: true, status: true, name: true, city: true, slug: true } });
  if (existing?.status === "SUSPENDED") {
    return NextResponse.json({ error: "This school is suspended. Contact State-ImmoCom support." }, { status: 403 });
  }

  let school;
  if (!existing) {
    school = await db.school.create({
      data: { ...data, ownerId: me.id, slug: await uniqueSchoolSlug(d.name, d.city), status: "PENDING_REVIEW" },
    });
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? process.env.CONTACT_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `School to verify: ${school.name}`,
        html: `<p><strong>${escapeHtml(school.name)}</strong> (${escapeHtml(school.city)}) submitted its profile.</p><p><a href="${siteUrl()}/dashboard/admin/schools">Review it in the admin</a></p>`,
      });
    }
  } else {
    const renamed = existing.name !== d.name || existing.city !== d.city;
    school = await db.school.update({
      where: { id: existing.id },
      data: { ...data, ...(renamed ? { slug: await uniqueSchoolSlug(d.name, d.city, existing.id) } : {}) },
    });
  }

  return NextResponse.json({ school: serializeSchool(school) });
}

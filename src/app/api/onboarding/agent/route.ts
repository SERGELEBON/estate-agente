import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { agentReviewEmail, sendEmail } from "@/lib/email";

const agentProfileSchema = z.object({
  name: z.string().trim().min(3, "Please enter your full name").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{8,20}$/, "Enter a valid phone number, e.g. +233 20 123 4567"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{8,20}$/, "Enter a valid WhatsApp number")
    .optional()
    .or(z.literal("")),
  company: z.string().trim().max(100).optional().or(z.literal("")),
  independent: z.boolean().default(false),
  license: z.string().trim().min(3, "Your licence number is required").max(50),
  serviceAreas: z.array(z.string().trim().min(2).max(40)).min(1, "Add at least one area you cover").max(12),
  bio: z
    .string()
    .trim()
    .min(80, "Tell clients a bit more about you (at least 80 characters)")
    .max(1000),
  acceptTerms: z.literal(true, { error: "You must accept the agent terms" }),
});

const SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  phone: true,
  whatsapp: true,
  company: true,
  license: true,
  serviceAreas: true,
  bio: true,
  agentStatus: true,
  profileCompletedAt: true,
} as const;

// GET /api/onboarding/agent — current agent profile (for prefilling the form)
export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (me.role !== "AGENT") return NextResponse.json({ error: "Agents only" }, { status: 403 });
  const user = await db.user.findUnique({ where: { id: me.id }, select: SELECT });
  return NextResponse.json({
    ...user,
    serviceAreas: user?.serviceAreas ? JSON.parse(user.serviceAreas) : [],
  });
}

// POST /api/onboarding/agent — submit the agent profile for review
export async function POST(request: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (me.role !== "AGENT") return NextResponse.json({ error: "Agents only" }, { status: 403 });

  const parsed = agentProfileSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return NextResponse.json({ error: "Please fix the highlighted fields.", fields }, { status: 400 });
  }
  const d = parsed.data;

  const current = await db.user.findUnique({ where: { id: me.id }, select: { agentStatus: true } });
  if (current?.agentStatus === "SUSPENDED") {
    return NextResponse.json({ error: "Your account is suspended. Contact support." }, { status: 403 });
  }
  // Already-approved agents keep their status when they edit; others go to review.
  const nextStatus = current?.agentStatus === "ACTIVE" ? "ACTIVE" : "PENDING_REVIEW";

  const user = await db.user.update({
    where: { id: me.id },
    data: {
      name: d.name,
      phone: d.phone,
      whatsapp: d.whatsapp || null,
      company: d.independent ? "Independent agent" : d.company || null,
      license: d.license,
      serviceAreas: JSON.stringify(Array.from(new Set(d.serviceAreas))),
      bio: d.bio,
      termsAcceptedAt: new Date(),
      profileCompletedAt: new Date(),
      agentStatus: nextStatus,
    },
    select: SELECT,
  });

  if (nextStatus === "PENDING_REVIEW" && current?.agentStatus !== "PENDING_REVIEW") {
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? process.env.CONTACT_EMAIL;
    if (adminEmail) {
      const mail = agentReviewEmail({ name: user.name, email: user.email, license: user.license });
      await sendEmail({ to: adminEmail, ...mail });
    }
  }

  return NextResponse.json({ ...user, serviceAreas: JSON.parse(user.serviceAreas ?? "[]") });
}

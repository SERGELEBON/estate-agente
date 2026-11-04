import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  conversationInclude,
  findContactableAgent,
  findProperty,
  GUEST_CONVERSATIONS_PER_HOUR,
  MESSAGE_MAX,
} from "@/lib/chat";
import { GUEST_COOKIE, ipHash } from "@/lib/security";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const startSchema = z.object({
  agentId: z.string().min(1),
  propertyId: z.string().min(1).optional().nullable(),
  body: z.string().trim().min(2, "Your message is too short").max(MESSAGE_MAX),
});

// GET /api/chat/guest — the guest's pending (unverified) conversation, if any
export async function GET(request: NextRequest) {
  const token = request.cookies.get(GUEST_COOKIE)?.value;
  if (!token) return NextResponse.json({ conversation: null });
  const conversation = await db.conversation.findUnique({
    where: { visitorToken: token },
    include: conversationInclude,
  });
  if (!conversation || conversation.clientId) return NextResponse.json({ conversation: null });
  return NextResponse.json({ conversation: { ...conversation, visitorToken: undefined } });
}

// POST /api/chat/guest — first message without an account. Further messages require email verification.
export async function POST(request: NextRequest) {
  if (await getSessionUser()) {
    return NextResponse.json({ error: "Already signed in", code: "USE_ACCOUNT" }, { status: 409 });
  }

  const parsed = startSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid message" }, { status: 400 });
  }
  const { agentId, propertyId, body } = parsed.data;

  // One unverified conversation per browser: the next message needs an email.
  const existingToken = request.cookies.get(GUEST_COOKIE)?.value;
  if (existingToken) {
    const existing = await db.conversation.findUnique({ where: { visitorToken: existingToken } });
    if (existing && !existing.clientId) {
      return NextResponse.json(
        { error: "Please confirm your email to keep chatting.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }
  }

  const agent = await findContactableAgent(agentId);
  if (!agent) return NextResponse.json({ error: "This agent is not available." }, { status: 404 });
  const property = await findProperty(propertyId, agent.id);

  const guestIpHash = ipHash(request);
  const recent = await db.conversation.count({
    where: { guestIpHash, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recent >= GUEST_CONVERSATIONS_PER_HOUR) {
    return NextResponse.json({ error: "Too many new conversations. Please sign in to continue." }, { status: 429 });
  }

  const visitorToken = randomBytes(24).toString("hex");
  const conversation = await db.$transaction(async (tx) => {
    const conv = await tx.conversation.create({
      data: {
        agentId: agent.id,
        propertyId: property?.id ?? null,
        visitorName: "Guest",
        visitorEmail: "",
        visitorToken,
        guestIpHash,
        subject: property ? `Inquiry about ${property.title}` : "New conversation",
        unreadForAgent: 1,
      },
    });
    await tx.message.create({
      data: {
        conversationId: conv.id,
        senderType: "VISITOR",
        senderName: "Guest",
        body,
        propertyId: property?.id ?? null,
        agentId: agent.id,
      },
    });
    return tx.conversation.findUniqueOrThrow({ where: { id: conv.id }, include: conversationInclude });
  });

  // The agent is emailed once the guest verifies their email (see /api/chat/claim) — avoids spam.
  const res = NextResponse.json({ conversation: { ...conversation, visitorToken: undefined } }, { status: 201 });
  res.cookies.set(GUEST_COOKIE, visitorToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

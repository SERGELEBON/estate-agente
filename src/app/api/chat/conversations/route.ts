import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { agentPublicSelect, findContactableAgent, findProperty, MESSAGE_MAX, notifyNewMessage } from "@/lib/chat";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  agentId: z.string().min(1),
  propertyId: z.string().min(1).optional().nullable(),
  body: z.string().trim().min(1, "Your message cannot be empty").max(MESSAGE_MAX),
});

// GET /api/chat/conversations — the signed-in client's inbox
export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const conversations = await db.conversation.findMany({
    where: { clientId: me.id },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      agent: { select: agentPublicSelect },
      property: { select: { id: true, title: true, images: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, senderType: true, createdAt: true } },
    },
  });

  const totalUnread = conversations.reduce((n, c) => n + c.unreadForVisitor, 0);
  return NextResponse.json({
    conversations: conversations.map(({ visitorToken: _t, guestIpHash: _ip, ...c }) => c),
    totalUnread,
  });
}

// POST /api/chat/conversations — client starts (or continues) a chat with the agent of their choice
export async function POST(request: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Authentication required", code: "AUTH_REQUIRED" }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid message" }, { status: 400 });
  }
  const { agentId, propertyId, body } = parsed.data;
  if (agentId === me.id) return NextResponse.json({ error: "You can't message yourself." }, { status: 400 });

  const agent = await findContactableAgent(agentId);
  if (!agent) return NextResponse.json({ error: "This agent is not available." }, { status: 404 });
  const property = await findProperty(propertyId, agent.id);

  const user = await db.user.findUniqueOrThrow({ where: { id: me.id }, select: { name: true, email: true, phone: true } });
  const displayName = user.name ?? user.email.split("@")[0];

  const existing = await db.conversation.findFirst({
    where: { clientId: me.id, agentId: agent.id, propertyId: property?.id ?? null, closed: false },
  });

  const conversationId = await db.$transaction(async (tx) => {
    const conv =
      existing ??
      (await tx.conversation.create({
        data: {
          clientId: me.id,
          agentId: agent.id,
          propertyId: property?.id ?? null,
          visitorName: displayName,
          visitorEmail: user.email,
          visitorPhone: user.phone,
          visitorToken: randomBytes(24).toString("hex"),
          subject: property ? `Inquiry about ${property.title}` : `Conversation with ${agent.name ?? "agent"}`,
        },
      }));
    await tx.message.create({
      data: {
        conversationId: conv.id,
        senderType: "VISITOR",
        senderUserId: me.id,
        senderName: displayName,
        senderEmail: user.email,
        body,
        propertyId: conv.propertyId,
        agentId: agent.id,
      },
    });
    await tx.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date(), unreadForAgent: { increment: 1 } },
    });
    return conv.id;
  });

  await notifyNewMessage({
    to: agent.email,
    recipientName: agent.name,
    senderName: displayName,
    body,
    propertyTitle: property?.title,
    previousUnread: existing?.unreadForAgent ?? 0,
    audience: "agent",
  });

  return NextResponse.json({ conversationId }, { status: existing ? 200 : 201 });
}

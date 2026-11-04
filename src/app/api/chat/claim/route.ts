import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { notifyNewMessage } from "@/lib/chat";
import { GUEST_COOKIE } from "@/lib/security";

// POST /api/chat/claim — attaches the guest's first conversation to the newly verified account.
export async function POST(request: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const token = request.cookies.get(GUEST_COOKIE)?.value;
  const clear = (res: NextResponse) => {
    res.cookies.set(GUEST_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  };
  if (!token) return NextResponse.json({ conversationId: null });

  const conv = await db.conversation.findUnique({
    where: { visitorToken: token },
    include: {
      agent: { select: { name: true, email: true } },
      property: { select: { title: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 1, select: { id: true, body: true } },
    },
  });
  if (!conv || conv.clientId || conv.agentId === me.id) {
    return clear(NextResponse.json({ conversationId: conv?.clientId === me.id ? conv.id : null }));
  }

  const user = await db.user.findUniqueOrThrow({
    where: { id: me.id },
    select: { name: true, email: true, phone: true },
  });
  const displayName = user.name ?? user.email.split("@")[0];

  // If this client already talks to this agent about the same listing, merge into that thread.
  const target = await db.conversation.findFirst({
    where: { clientId: me.id, agentId: conv.agentId, propertyId: conv.propertyId, closed: false },
  });

  let conversationId: string;
  if (target) {
    await db.$transaction([
      db.message.updateMany({
        where: { conversationId: conv.id },
        data: { conversationId: target.id, senderName: displayName, senderEmail: user.email, senderUserId: me.id },
      }),
      db.conversation.update({
        where: { id: target.id },
        data: { lastMessageAt: new Date(), unreadForAgent: { increment: conv.unreadForAgent } },
      }),
      db.conversation.delete({ where: { id: conv.id } }),
    ]);
    conversationId = target.id;
  } else {
    await db.$transaction([
      db.conversation.update({
        where: { id: conv.id },
        data: {
          clientId: me.id,
          visitorName: displayName,
          visitorEmail: user.email,
          visitorPhone: user.phone,
        },
      }),
      db.message.updateMany({
        where: { conversationId: conv.id, senderType: "VISITOR" },
        data: { senderName: displayName, senderEmail: user.email, senderUserId: me.id },
      }),
    ]);
    conversationId = conv.id;
  }

  await notifyNewMessage({
    to: conv.agent.email,
    recipientName: conv.agent.name,
    senderName: displayName,
    body: conv.messages[0]?.body ?? "",
    propertyTitle: conv.property?.title,
    previousUnread: 0,
    audience: "agent",
  });

  return clear(NextResponse.json({ conversationId }));
}

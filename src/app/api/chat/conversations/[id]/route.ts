import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { conversationInclude } from "@/lib/chat";

export const dynamic = "force-dynamic";

// GET /api/chat/conversations/[id] — full thread for its client; marks agent replies as read
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;

  const conversation = await db.conversation.findUnique({ where: { id }, include: conversationInclude });
  if (!conversation || conversation.clientId !== me.id) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (conversation.unreadForVisitor > 0) {
    await db.$transaction([
      db.conversation.update({ where: { id }, data: { unreadForVisitor: 0 } }),
      db.message.updateMany({
        where: { conversationId: id, senderType: { in: ["AGENT", "ADMIN"] }, isRead: false },
        data: { isRead: true },
      }),
    ]);
  }

  const { visitorToken: _t, guestIpHash: _ip, ...safe } = conversation;
  return NextResponse.json({ conversation: { ...safe, unreadForVisitor: 0 } });
}

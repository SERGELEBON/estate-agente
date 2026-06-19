import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messagingErrors } from "@/lib/messaging-errors";

// GET /api/conversations/visitor?token=xxx
// Public endpoint — visitor uses their magic token (received after submitting the form) to view their conversation.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    if (!token || token.length < 10) {
      const e = messagingErrors.invalidVisitorToken();
      return NextResponse.json(e, { status: 400 });
    }

    const conversation = await db.conversation.findUnique({
      where: { visitorToken: token },
      include: {
        property: { select: { id: true, title: true, slug: true, images: true, price: true, location: true } },
        agent: { select: { id: true, name: true, email: true, phone: true, image: true, company: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            senderType: true,
            senderName: true,
            body: true,
            isRead: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      const e = messagingErrors.invalidVisitorToken();
      return NextResponse.json(e, { status: 404 });
    }

    // If visitor has unread messages from agent, mark them as read
    if (conversation.unreadForVisitor > 0) {
      await db.conversation.update({
        where: { id: conversation.id },
        data: { unreadForVisitor: 0 },
      });
      await db.message.updateMany({
        where: { conversationId: conversation.id, senderType: { in: ["AGENT", "ADMIN"] }, isRead: false },
        data: { isRead: true },
      });
      conversation.unreadForVisitor = 0;
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Error fetching visitor conversation:", error);
    const e = messagingErrors.serverError("fetch");
    return NextResponse.json(e, { status: 500 });
  }
}

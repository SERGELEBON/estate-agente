import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { messagingErrors } from "@/lib/messaging-errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/conversations/[id] — fetch a conversation with all messages
// Auth: either authenticated agent/admin OR visitor with ?token=xxx
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const visitorToken = searchParams.get("token");

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;

    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, title: true, slug: true, images: true, price: true, location: true } },
        agent: { select: { id: true, name: true, email: true, phone: true, image: true, company: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            senderType: true,
            senderUserId: true,
            senderName: true,
            body: true,
            isRead: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      const e = messagingErrors.conversationNotFound();
      return NextResponse.json(e, { status: 404 });
    }

    // Authorization check
    const isAgent = userRole === "ADMIN" || conversation.agentId === userId;
    const isVisitor = visitorToken && visitorToken === conversation.visitorToken;

    if (!isAgent && !isVisitor) {
      // Distinguish "needs login" vs "wrong identity"
      if (!session?.user) {
        const e = messagingErrors.authRequired();
        return NextResponse.json(e, { status: 401 });
      }
      const e = messagingErrors.unauthorized();
      return NextResponse.json(e, { status: 403 });
    }

    // Mark messages as read for the accessing party
    if (isAgent && conversation.unreadForAgent > 0) {
      await db.conversation.update({
        where: { id },
        data: { unreadForAgent: 0 },
      });
      await db.message.updateMany({
        where: { conversationId: id, senderType: "VISITOR", isRead: false },
        data: { isRead: true },
      });
      conversation.unreadForAgent = 0;
    } else if (isVisitor && conversation.unreadForVisitor > 0) {
      await db.conversation.update({
        where: { id },
        data: { unreadForVisitor: 0 },
      });
      await db.message.updateMany({
        where: { conversationId: id, senderType: { in: ["AGENT", "ADMIN"] }, isRead: false },
        data: { isRead: true },
      });
      conversation.unreadForVisitor = 0;
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    const e = messagingErrors.serverError("fetch");
    return NextResponse.json(e, { status: 500 });
  }
}

// PATCH /api/conversations/[id] — toggle closed status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      const e = messagingErrors.authRequired();
      return NextResponse.json(e, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    const userRole = (session.user as any)?.role;

    const conversation = await db.conversation.findUnique({ where: { id } });
    if (!conversation) {
      const e = messagingErrors.conversationNotFound();
      return NextResponse.json(e, { status: 404 });
    }
    if (userRole !== "ADMIN" && conversation.agentId !== userId) {
      const e = messagingErrors.unauthorized();
      return NextResponse.json(e, { status: 403 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      const e = messagingErrors.malformedBody();
      return NextResponse.json(e, { status: 400 });
    }

    const updated = await db.conversation.update({
      where: { id },
      data: { closed: body.closed === true },
    });
    return NextResponse.json({ conversation: updated });
  } catch (error) {
    console.error("Error updating conversation:", error);
    const e = messagingErrors.serverError("update");
    return NextResponse.json(e, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { messagingErrors, zodIssuesToFields } from "@/lib/messaging-errors";
import { notifyNewMessage } from "@/lib/chat";

const replySchema = z.object({
  body: z
    .string({ error: "Your reply is required" })
    .min(1, "Your reply cannot be empty")
    .max(5000, "Your reply is too long (max 5000 characters)"),
  senderType: z.enum(["AGENT", "ADMIN", "VISITOR"]).optional(),
  visitorToken: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/conversations/[id]/messages — send a new message in the conversation
// Auth: authenticated agent/admin OR visitor with visitorToken in body
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    let body: any;
    try {
      body = await request.json();
    } catch {
      const e = messagingErrors.malformedBody();
      return NextResponse.json(e, { status: 400 });
    }

    let validated: any;
    try {
      validated = replySchema.parse(body);
    } catch (error: any) {
      const e = messagingErrors.validationFailed(zodIssuesToFields(error));
      return NextResponse.json(e, { status: 400 });
    }

    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        agent: { select: { name: true, email: true } },
        client: { select: { name: true, email: true } },
        property: { select: { title: true } },
      },
    });
    if (!conversation) {
      const e = messagingErrors.conversationNotFound();
      return NextResponse.json(e, { status: 404 });
    }
    if (conversation.closed) {
      // Caller is the agent if they're logged in; otherwise visitor
      const session = await getServerSession(authOptions);
      const by = session?.user ? "agent" : "visitor";
      const e = messagingErrors.conversationClosed(by);
      return NextResponse.json(e, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;
    const visitorToken = body.visitorToken;

    const isAgent = !!session?.user && (userRole === "ADMIN" || conversation.agentId === userId);
    const isClient = !!session?.user && !!conversation.clientId && conversation.clientId === userId;
    // Legacy magic-link visitors only — guest/claimed conversations require a verified account.
    const isVisitor =
      !conversation.clientId &&
      !conversation.guestIpHash &&
      !!visitorToken &&
      visitorToken === conversation.visitorToken;

    if (isClient && !isAgent) {
      // handled below as the customer side
    } else if (!isAgent && !isVisitor) {
      if (!session?.user) {
        const e = messagingErrors.authRequired();
        return NextResponse.json(e, { status: 401 });
      }
      const e = messagingErrors.unauthorized();
      return NextResponse.json(e, { status: 403 });
    }

    const senderType = isAgent
      ? (userRole === "ADMIN" ? "ADMIN" : "AGENT")
      : "VISITOR";

    // Create message + update conversation counters in a transaction
    const message = await db.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId: id,
          senderType,
          senderUserId: isAgent || isClient ? userId : null,
          senderName: isAgent
            ? (await tx.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name ?? "Agent"
            : conversation.visitorName,
          senderEmail: isAgent ? "" : conversation.visitorEmail,
          senderPhone: isAgent ? null : conversation.visitorPhone,
          subject: "",
          body: validated.body,
          propertyId: conversation.propertyId,
          agentId: conversation.agentId,
          isRead: false,
        },
      });

      // Update conversation: increment unread for the OTHER party, refresh lastMessageAt
      const unreadUpdate = isAgent
        ? { unreadForVisitor: { increment: 1 } }
        : { unreadForAgent: { increment: 1 } };

      await tx.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date(), ...unreadUpdate },
      });

      return msg;
    });

    if (isAgent) {
      await notifyNewMessage({
        to: conversation.client?.email ?? (conversation.visitorEmail || null),
        recipientName: conversation.client?.name ?? conversation.visitorName,
        senderName: message.senderName || "Your agent",
        body: validated.body,
        propertyTitle: conversation.property?.title,
        previousUnread: conversation.unreadForVisitor,
        audience: "client",
      });
    } else {
      await notifyNewMessage({
        to: conversation.agent.email,
        recipientName: conversation.agent.name,
        senderName: conversation.visitorName,
        body: validated.body,
        propertyTitle: conversation.property?.title,
        previousUnread: conversation.unreadForAgent,
        audience: "agent",
      });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    console.error("Error sending message:", error);
    const e = messagingErrors.serverError("send");
    return NextResponse.json(e, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversationCreateSchema } from "@/lib/validators";
import { messagingErrors, zodIssuesToFields } from "@/lib/messaging-errors";

// GET /api/conversations — list conversations for the authenticated agent/admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      const e = messagingErrors.authRequired();
      return NextResponse.json(e, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const { searchParams } = new URL(request.url);

    const filter = searchParams.get("filter"); // "unread" | "open" | "closed" | null
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

    const where: any = {};
    if (userRole !== "ADMIN") {
      where.agentId = userId;
    }
    if (filter === "unread") where.unreadForAgent = { gt: 0 };
    if (filter === "open") where.closed = false;
    if (filter === "closed") where.closed = true;

    const conversations = await db.conversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      take: limit,
      include: {
        property: { select: { id: true, title: true, slug: true, images: true } },
        agent: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, body: true, senderType: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    });

    const totalUnread = await db.conversation.aggregate({
      where: userRole === "ADMIN" ? { unreadForAgent: { gt: 0 } } : { agentId: userId, unreadForAgent: { gt: 0 } },
      _sum: { unreadForAgent: true },
    });

    return NextResponse.json({
      conversations,
      totalUnread: totalUnread._sum.unreadForAgent ?? 0,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    const e = messagingErrors.serverError("fetch");
    return NextResponse.json(e, { status: 500 });
  }
}

// POST /api/conversations — public endpoint, creates a new conversation from a property inquiry
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const e = messagingErrors.malformedBody();
      return NextResponse.json(e, { status: 400 });
    }

    let validated: any;
    try {
      validated = conversationCreateSchema.parse(body);
    } catch (error: any) {
      const e = messagingErrors.validationFailed(zodIssuesToFields(error));
      return NextResponse.json(e, { status: 400 });
    }

    // Verify the agent exists
    const agent = await db.user.findUnique({ where: { id: validated.agentId } });
    if (!agent) {
      const e = messagingErrors.agentNotFound();
      return NextResponse.json(e, { status: 404 });
    }

    // Verify the property exists (if provided)
    if (validated.propertyId) {
      const property = await db.property.findUnique({ where: { id: validated.propertyId } });
      if (!property) {
        const e = messagingErrors.propertyNotFound();
        return NextResponse.json(e, { status: 404 });
      }
    }

    const visitorToken = randomBytes(24).toString("hex");

    // Create conversation + first message in a transaction
    const conversation = await db.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          propertyId: validated.propertyId ?? null,
          agentId: validated.agentId,
          visitorName: validated.visitorName,
          visitorEmail: validated.visitorEmail.toLowerCase().trim(),
          visitorPhone: validated.visitorPhone ?? null,
          visitorToken,
          subject: validated.subject,
          unreadForAgent: 1,
          unreadForVisitor: 0,
          lastMessageAt: new Date(),
        },
      });

      await tx.message.create({
        data: {
          conversationId: conv.id,
          senderType: "VISITOR",
          senderName: validated.visitorName,
          senderEmail: validated.visitorEmail.toLowerCase().trim(),
          senderPhone: validated.visitorPhone ?? null,
          subject: validated.subject,
          body: validated.body,
          propertyId: validated.propertyId ?? null,
          agentId: validated.agentId,
          isRead: false,
        },
      });

      return conv;
    });

    const fullConversation = await db.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        property: { select: { id: true, title: true, slug: true } },
        agent: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ conversation: fullConversation, visitorToken }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    const e = messagingErrors.serverError("create");
    return NextResponse.json(e, { status: 500 });
  }
}

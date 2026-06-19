import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { messagingErrors, zodIssuesToFields } from "@/lib/messaging-errors";

const visitorSendSchema = z.object({
  token: z
    .string({ error: "Conversation link is missing" })
    .min(10, "Invalid conversation link"),
  body: z
    .string({ error: "Your message is required" })
    .min(1, "Your message cannot be empty")
    .max(5000, "Your message is too long (max 5000 characters)"),
});

// POST /api/conversations/visitor/send
// Public endpoint — visitor sends a follow-up message via their magic token.
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
      validated = visitorSendSchema.parse(body);
    } catch (error: any) {
      const e = messagingErrors.validationFailed(zodIssuesToFields(error));
      return NextResponse.json(e, { status: 400 });
    }

    const conversation = await db.conversation.findUnique({
      where: { visitorToken: validated.token },
    });
    if (!conversation) {
      const e = messagingErrors.invalidVisitorToken();
      return NextResponse.json(e, { status: 404 });
    }
    if (conversation.closed) {
      const e = messagingErrors.conversationClosed("agent");
      return NextResponse.json(e, { status: 400 });
    }

    const message = await db.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderType: "VISITOR",
          senderName: conversation.visitorName,
          senderEmail: conversation.visitorEmail,
          senderPhone: conversation.visitorPhone,
          subject: "",
          body: validated.body,
          propertyId: conversation.propertyId,
          agentId: conversation.agentId,
          isRead: false,
        },
      });
      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadForAgent: { increment: 1 },
        },
      });
      return msg;
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    console.error("Error sending visitor message:", error);
    const e = messagingErrors.serverError("send");
    return NextResponse.json(e, { status: 500 });
  }
}

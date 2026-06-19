import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { messagingErrors, zodIssuesToFields } from "@/lib/messaging-errors";

const contactSchema = z.object({
  senderName: z
    .string({ error: "Your name is required" })
    .min(2, "Your name must be at least 2 characters"),
  senderEmail: z
    .string({ error: "Your email is required" })
    .email("Please enter a valid email address"),
  senderPhone: z.string().optional(),
  subject: z
    .string({ error: "Subject is required" })
    .min(3, "Subject must be at least 3 characters"),
  body: z
    .string({ error: "Your message is required" })
    .min(10, "Your message must be at least 10 characters"),
});

// POST /api/contact - Public contact form submission (general inquiry, not property-specific)
// Saves as an internal Conversation addressed to the admin. No email redirection — reply happens in-app.
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const e = messagingErrors.malformedBody();
      return NextResponse.json(e, { status: 400 });
    }

    let validatedData: any;
    try {
      validatedData = contactSchema.parse(body);
    } catch (error: any) {
      const e = messagingErrors.validationFailed(zodIssuesToFields(error));
      return NextResponse.json(e, { status: 400 });
    }

    // Find the admin user to associate the conversation with
    const adminUser = await db.user.findFirst({ where: { role: "ADMIN" } });
    if (!adminUser) {
      const e: any = {
        error: "Support unavailable",
        message: "We couldn't find anyone to receive your message at the moment.",
        hint: "Please try again later, or reach us directly by phone if your request is urgent.",
        code: "SERVER_ERROR",
      };
      return NextResponse.json(e, { status: 500 });
    }

    const visitorToken = randomBytes(24).toString("hex");

    const conversation = await db.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          propertyId: null, // general inquiry — no property
          agentId: adminUser.id,
          visitorName: validatedData.senderName,
          visitorEmail: validatedData.senderEmail.toLowerCase().trim(),
          visitorPhone: validatedData.senderPhone || null,
          visitorToken,
          subject: validatedData.subject,
          unreadForAgent: 1,
          lastMessageAt: new Date(),
        },
      });
      await tx.message.create({
        data: {
          conversationId: conv.id,
          senderType: "VISITOR",
          senderName: validatedData.senderName,
          senderEmail: validatedData.senderEmail.toLowerCase().trim(),
          senderPhone: validatedData.senderPhone || null,
          subject: validatedData.subject,
          body: validatedData.body,
          agentId: adminUser.id,
          isRead: false,
        },
      });
      return conv;
    });

    return NextResponse.json(
      {
        message: "Message sent successfully",
        conversationId: conversation.id,
        visitorToken,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error processing contact form:", error);
    const e = messagingErrors.serverError("create");
    return NextResponse.json(e, { status: 500 });
  }
}

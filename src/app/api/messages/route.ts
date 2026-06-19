import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { messageSchema } from "@/lib/validators";

// GET /api/messages - List messages for authenticated agent
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const userRole = (session.user as any)?.role;
    const { searchParams } = new URL(request.url);

    const isRead = searchParams.get("isRead");
    const propertyId = searchParams.get("propertyId");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    const where: any = {};

    // ADMIN can see all messages, AGENT only their own
    if (userRole !== "ADMIN") {
      where.agentId = userId;
    }

    if (isRead === "true") {
      where.isRead = true;
    } else if (isRead === "false") {
      where.isRead = false;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              slug: true,
              images: true,
            },
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.message.count({ where }),
    ]);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages - Create a message (public - no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = messageSchema.parse(body);

    const message = await db.message.create({
      data: validatedData,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    console.error("Error creating message:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

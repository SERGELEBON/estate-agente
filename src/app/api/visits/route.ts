import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { visitSchema } from "@/lib/validators";

// GET /api/visits - List visits for authenticated agent
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const userRole = (session.user as any)?.role;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    const where: any = {};

    // ADMIN can see all visits, AGENT only their own
    if (userRole !== "ADMIN") {
      where.agentId = userId;
    }

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [visits, total] = await Promise.all([
      db.visit.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              slug: true,
              location: true,
              images: true,
            },
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { visitDate: "asc" },
        skip,
        take: limit,
      }),
      db.visit.count({ where }),
    ]);

    return NextResponse.json({
      visits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching visits:", error);
    return NextResponse.json(
      { error: "Failed to fetch visits" },
      { status: 500 }
    );
  }
}

// POST /api/visits - Create a visit (public - for scheduling)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = visitSchema.parse(body);

    // Validate that the property and agent exist
    const property = await db.property.findUnique({
      where: { id: validatedData.propertyId },
    });
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const agent = await db.user.findUnique({
      where: { id: validatedData.agentId },
    });
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    const visit = await db.visit.create({
      data: {
        visitorName: validatedData.visitorName,
        visitorEmail: validatedData.visitorEmail,
        visitorPhone: validatedData.visitorPhone,
        visitDate: new Date(validatedData.visitDate),
        status: validatedData.status ?? "SCHEDULED",
        notes: validatedData.notes ?? null,
        propertyId: validatedData.propertyId,
        agentId: validatedData.agentId,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
            location: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(visit, { status: 201 });
  } catch (error: any) {
    console.error("Error creating visit:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create visit" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { visitUpdateSchema } from "@/lib/validators";

// PUT /api/visits/[id] - Update visit status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any)?.id;
    const userRole = (session.user as any)?.role;

    // Check if visit exists
    const existingVisit = await db.visit.findUnique({ where: { id } });
    if (!existingVisit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Only the assigned agent or ADMIN can update
    if (userRole !== "ADMIN" && existingVisit.agentId !== userId) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = visitUpdateSchema.parse(body);

    const visit = await db.visit.update({
      where: { id },
      data: validatedData,
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

    return NextResponse.json(visit);
  } catch (error: any) {
    console.error("Error updating visit:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update visit" },
      { status: 500 }
    );
  }
}

// DELETE /api/visits/[id] - Delete a visit (ADMIN only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const userRole = (session.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Check if visit exists
    const existingVisit = await db.visit.findUnique({ where: { id } });
    if (!existingVisit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    await db.visit.delete({ where: { id } });

    return NextResponse.json({ message: "Visit deleted successfully" });
  } catch (error) {
    console.error("Error deleting visit:", error);
    return NextResponse.json(
      { error: "Failed to delete visit" },
      { status: 500 }
    );
  }
}

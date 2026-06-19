import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { propertyUpdateSchema } from "@/lib/validators";

// GET /api/properties/[id] - Get single property by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const property = await db.property.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
            license: true,
            image: true,
            bio: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        visits: {
          where: { status: "SCHEDULED" },
          orderBy: { visitDate: "asc" },
          take: 5,
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Increment views
    await db.property.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ ...property, views: property.views + 1 });
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json(
      { error: "Failed to fetch property" },
      { status: 500 }
    );
  }
}

// PUT /api/properties/[id] - Update a property
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
    const userRole = (session.user as any)?.role;
    const userId = (session.user as any)?.id;

    // Check if property exists
    const existingProperty = await db.property.findUnique({ where: { id } });
    if (!existingProperty) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Only owner agent or ADMIN can update
    if (userRole !== "ADMIN" && existingProperty.agentId !== userId) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = propertyUpdateSchema.parse(body);

    // If slug is being updated, ensure uniqueness
    if (validatedData.slug && validatedData.slug !== existingProperty.slug) {
      const slugExists = await db.property.findUnique({ where: { slug: validatedData.slug } });
      if (slugExists) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 400 }
        );
      }
    }

    const property = await db.property.update({
      where: { id },
      data: validatedData,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(property);
  } catch (error: any) {
    console.error("Error updating property:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id] - Delete a property
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
    const userId = (session.user as any)?.id;

    // Check if property exists
    const existingProperty = await db.property.findUnique({ where: { id } });
    if (!existingProperty) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Only owner agent or ADMIN can delete
    if (userRole !== "ADMIN" && existingProperty.agentId !== userId) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    await db.property.delete({ where: { id } });

    return NextResponse.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { propertySchema } from "@/lib/validators";
import { slugify } from "@/lib/helpers";

// GET /api/properties - List properties with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const listingType = searchParams.get("listingType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const bedrooms = searchParams.get("bedrooms");
    const location = searchParams.get("location");
    const featured = searchParams.get("featured");
    const statusFilter = searchParams.get("status");
    const agentFilter = searchParams.get("agentId");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "12", 10);

    // Check if user is authenticated admin requesting all properties
    const session = await getServerSession(authOptions);
    const isAdmin = (session?.user as any)?.role === "ADMIN";

    // Build where clause dynamically
    // Public users only see AVAILABLE; admins can see all or filter by specific status
    const where: any = {};
    if (statusFilter && isAdmin) {
      where.status = statusFilter;
    } else if (!isAdmin) {
      where.status = "AVAILABLE";
    }
    // If admin with no status filter, show all statuses (no where.status)

    if (type) {
      where.type = type;
    }
    if (listingType) {
      where.listingType = listingType;
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (bedrooms) {
      where.bedrooms = { gte: parseInt(bedrooms, 10) };
    }
    if (location) {
      where.OR = [
        { location: { contains: location } },
        { city: { contains: location } },
        { region: { contains: location } },
      ];
    }
    if (featured === "true") {
      where.featured = true;
    }
    if (agentFilter) {
      where.agentId = agentFilter;
    }

    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
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
        orderBy: [
          { featured: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      db.property.count({ where }),
    ]);

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

// POST /api/properties - Create a new property
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "AGENT" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = propertySchema.parse(body);

    // Generate slug if not provided
    if (!validatedData.slug) {
      const baseSlug = slugify(validatedData.title);
      const existing = await db.property.findFirst({ where: { slug: { startsWith: baseSlug } } });
      validatedData.slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;
    }

    // Ensure slug is unique
    const slugExists = await db.property.findUnique({ where: { slug: validatedData.slug } });
    if (slugExists) {
      validatedData.slug = `${validatedData.slug}-${Date.now()}`;
    }

    const property = await db.property.create({
      data: validatedData as any,
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

    return NextResponse.json(property, { status: 201 });
  } catch (error: any) {
    console.error("Error creating property:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/stats - Dashboard statistics (requires auth)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const userRole = (session.user as any)?.role;

    if (userRole === "ADMIN") {
      // Admin sees all platform stats
      const [
        totalProperties,
        totalUsers,
        totalMessages,
        totalVisits,
        availableProperties,
        soldProperties,
        rentedProperties,
        reservedProperties,
        featuredProperties,
        unreadMessages,
        scheduledVisits,
        agents,
        propertiesByType,
        recentProperties,
        recentMessages,
      ] = await Promise.all([
        db.property.count(),
        db.user.count(),
        db.message.count(),
        db.visit.count(),
        db.property.count({ where: { status: "AVAILABLE" } }),
        db.property.count({ where: { status: "SOLD" } }),
        db.property.count({ where: { status: "RENTED" } }),
        db.property.count({ where: { status: "RESERVED" } }),
        db.property.count({ where: { featured: true } }),
        db.message.count({ where: { isRead: false } }),
        db.visit.count({ where: { status: "SCHEDULED" } }),
        db.user.count({ where: { role: "AGENT" } }),
        db.property.groupBy({
          by: ["type"],
          _count: { type: true },
        }),
        db.property.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            price: true,
            type: true,
            status: true,
            createdAt: true,
          },
        }),
        db.message.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            senderName: true,
            subject: true,
            isRead: true,
            createdAt: true,
          },
        }),
      ]);

      // Calculate total property value
      const propertyValues = await db.property.aggregate({
        _sum: { price: true },
        where: { status: "AVAILABLE" },
      });

      return NextResponse.json({
        role: "ADMIN",
        overview: {
          totalProperties,
          totalUsers,
          totalMessages,
          totalVisits,
          totalPropertyValue: propertyValues._sum.price ?? 0,
        },
        properties: {
          available: availableProperties,
          sold: soldProperties,
          rented: rentedProperties,
          reserved: reservedProperties,
          featured: featuredProperties,
          byType: propertiesByType.map((item) => ({
            type: item.type,
            count: item._count.type,
          })),
        },
        communications: {
          unreadMessages,
          scheduledVisits,
        },
        users: {
          agents,
          total: totalUsers,
        },
        recent: {
          properties: recentProperties,
          messages: recentMessages,
        },
      });
    } else {
      // Agent sees only their own stats
      const [
        myProperties,
        myMessages,
        myVisits,
        myAvailableProperties,
        mySoldProperties,
        myRentedProperties,
        myUnreadMessages,
        myScheduledVisits,
        myFeaturedProperties,
        myPropertiesByType,
        myRecentMessages,
        myUpcomingVisits,
      ] = await Promise.all([
        db.property.count({ where: { agentId: userId } }),
        db.message.count({ where: { agentId: userId } }),
        db.visit.count({ where: { agentId: userId } }),
        db.property.count({ where: { agentId: userId, status: "AVAILABLE" } }),
        db.property.count({ where: { agentId: userId, status: "SOLD" } }),
        db.property.count({ where: { agentId: userId, status: "RENTED" } }),
        db.message.count({ where: { agentId: userId, isRead: false } }),
        db.visit.count({ where: { agentId: userId, status: "SCHEDULED" } }),
        db.property.count({ where: { agentId: userId, featured: true } }),
        db.property.groupBy({
          by: ["type"],
          where: { agentId: userId },
          _count: { type: true },
        }),
        db.message.findMany({
          where: { agentId: userId },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            senderName: true,
            subject: true,
            isRead: true,
            createdAt: true,
          },
        }),
        db.visit.findMany({
          where: { agentId: userId, status: "SCHEDULED" },
          take: 5,
          orderBy: { visitDate: "asc" },
          select: {
            id: true,
            visitorName: true,
            visitDate: true,
            property: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        }),
      ]);

      // Calculate agent's total property value
      const myPropertyValues = await db.property.aggregate({
        _sum: { price: true },
        where: { agentId: userId, status: "AVAILABLE" },
      });

      // Total views on agent's properties
      const myViews = await db.property.aggregate({
        _sum: { views: true },
        where: { agentId: userId },
      });

      return NextResponse.json({
        role: "AGENT",
        overview: {
          totalProperties: myProperties,
          totalMessages: myMessages,
          totalVisits: myVisits,
          totalPropertyValue: myPropertyValues._sum.price ?? 0,
          totalViews: myViews._sum.views ?? 0,
        },
        properties: {
          available: myAvailableProperties,
          sold: mySoldProperties,
          rented: myRentedProperties,
          featured: myFeaturedProperties,
          byType: myPropertiesByType.map((item) => ({
            type: item.type,
            count: item._count.type,
          })),
        },
        communications: {
          unreadMessages: myUnreadMessages,
          scheduledVisits: myScheduledVisits,
        },
        recent: {
          messages: myRecentMessages,
          upcomingVisits: myUpcomingVisits,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

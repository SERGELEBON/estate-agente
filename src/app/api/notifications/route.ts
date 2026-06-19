import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/notifications — unread counts for the authenticated agent/admin
// Lightweight endpoint intended for polling (every 30-60s) by the dashboard layout.
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ unread: 0, totalConversations: 0 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const where = userRole === "ADMIN" ? {} : { agentId: userId };
    const [unreadAgg, totalAgg, recentUnread] = await Promise.all([
      db.conversation.aggregate({
        where: { ...where, unreadForAgent: { gt: 0 } },
        _sum: { unreadForAgent: true },
      }),
      db.conversation.count({ where }),
      db.conversation.findMany({
        where: { ...where, unreadForAgent: { gt: 0 } },
        orderBy: { lastMessageAt: "desc" },
        take: 5,
        select: {
          id: true,
          visitorName: true,
          subject: true,
          unreadForAgent: true,
          lastMessageAt: true,
          property: { select: { title: true } },
        },
      }),
    ]);

    return NextResponse.json({
      unread: unreadAgg._sum.unreadForAgent ?? 0,
      totalConversations: totalAgg,
      recent: recentUnread,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ unread: 0, totalConversations: 0, recent: [] });
  }
}

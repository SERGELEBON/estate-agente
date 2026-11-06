import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { serializeSchool } from "@/lib/schools";

export const dynamic = "force-dynamic";

// GET /api/admin/schools?status=PENDING_REVIEW — every school, for moderation
export async function GET(request: NextRequest) {
  const me = await getSessionUser();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const status = new URL(request.url).searchParams.get("status");
  const schools = await db.school.findMany({
    where: status ? { status } : {},
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      owner: { select: { name: true, email: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, rating: true, comment: true, hidden: true, createdAt: true, author: { select: { name: true, email: true } } },
      },
    },
  });
  return NextResponse.json({ schools: schools.map(serializeSchool) });
}

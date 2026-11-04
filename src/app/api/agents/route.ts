import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/agents?q=east%20legon — public directory of verified agents clients can message
export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get("q")?.trim();

  const agents = await db.user.findMany({
    where: {
      role: "AGENT",
      agentStatus: "ACTIVE",
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
              { serviceAreas: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      image: true,
      company: true,
      bio: true,
      serviceAreas: true,
      license: true,
      _count: { select: { properties: true } },
    },
    orderBy: { name: "asc" },
    take: 50,
  });

  return NextResponse.json({
    agents: agents.map((a) => ({
      ...a,
      serviceAreas: a.serviceAreas ? (JSON.parse(a.serviceAreas) as string[]) : [],
      verified: !!a.license,
    })),
  });
}

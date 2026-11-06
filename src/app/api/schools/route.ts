import { NextRequest, NextResponse } from "next/server";
import { listSchools } from "@/lib/school-queries";

export const dynamic = "force-dynamic";

// GET /api/schools?language=english|french&country=GH,CI&city=Accra&q=&sort=rating&page=1
export async function GET(request: NextRequest) {
  const p = new URL(request.url).searchParams;
  const data = await listSchools({
    language: p.get("language"),
    country: p.get("country"),
    city: p.get("city"),
    q: p.get("q"),
    sort: p.get("sort"),
    page: Number(p.get("page")) || 1,
    limit: Number(p.get("limit")) || 12,
  });
  return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

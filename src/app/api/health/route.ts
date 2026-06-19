import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const count = await db.property.count();
    const available = await db.property.count({ where: { status: "AVAILABLE" } });

    return NextResponse.json({
      status: "ok",
      database: "connected",
      totalProperties: count,
      availableProperties: available,
      prismaClient: "working",
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      database: "error",
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

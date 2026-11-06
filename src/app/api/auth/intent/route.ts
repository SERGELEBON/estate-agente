import { NextRequest, NextResponse } from "next/server";
import { INTENT_COOKIE } from "@/lib/security";

// POST /api/auth/intent { intent: "agent" | "client" | "school" }
// Remembers, for ~10 minutes, which kind of account a NEW Google user should get.
// It only affects account creation; agents still need a complete profile and admin approval.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const intent = body?.intent === "agent" || body?.intent === "school" ? body.intent : "client";
  const res = NextResponse.json({ ok: true });
  res.cookies.set(INTENT_COOKIE, intent, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}

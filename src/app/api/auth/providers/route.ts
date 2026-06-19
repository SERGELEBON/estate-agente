import { NextResponse } from "next/server";

// GET /api/auth/providers - Check which OAuth providers are configured
export async function GET() {
  return NextResponse.json({
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    facebook: !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    return NextResponse.json({
      hasSession: !!session,
      session: session,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      nextAuthSecretConfigured: !!process.env.NEXTAUTH_SECRET,
      env: process.env.NODE_ENV,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Test direct authentication
    const { authOptions: auth } = await import("@/lib/auth");
    const credentialsProvider = auth.providers.find((p: any) => p.id === "credentials");

    if (!credentialsProvider) {
      return NextResponse.json({
        error: "Credentials provider not found",
        providers: auth.providers.map((p: any) => p.id),
      });
    }

    const authorize = (credentialsProvider as any).authorize;
    const result = await authorize({ email, password }, {} as any);

    return NextResponse.json({
      success: !!result,
      user: result,
      message: result ? "Authorize successful" : "Authorize failed",
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

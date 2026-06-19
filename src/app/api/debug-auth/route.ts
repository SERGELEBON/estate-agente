import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("========================================");
    console.log("[DEBUG] Starting authentication test");
    console.log("[DEBUG] Email:", email);
    console.log("[DEBUG] Environment:", process.env.NODE_ENV);
    console.log("[DEBUG] DATABASE_URL set:", !!process.env.DATABASE_URL);
    console.log("========================================");

    // Test 1: Database connection
    console.log("[DEBUG] Test 1: Testing database connection...");
    const propertyCount = await db.property.count();
    console.log("[DEBUG] Database connected. Properties:", propertyCount);

    // Test 2: Find user
    console.log("[DEBUG] Test 2: Looking for user...");
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      console.log("[DEBUG] User not found in database");
      return NextResponse.json({
        success: false,
        step: "find_user",
        error: "User not found",
      });
    }

    console.log("[DEBUG] User found:", {
      id: user.id,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
    });

    // Test 3: Password comparison
    if (!user.password) {
      console.log("[DEBUG] User has no password (OAuth user)");
      return NextResponse.json({
        success: false,
        step: "check_password",
        error: "OAuth user - no password",
      });
    }

    console.log("[DEBUG] Test 3: Comparing passwords...");
    const isValid = await compare(password, user.password);
    console.log("[DEBUG] Password valid:", isValid);

    if (!isValid) {
      return NextResponse.json({
        success: false,
        step: "compare_password",
        error: "Invalid password",
      });
    }

    // Success
    console.log("[DEBUG] ✓ All tests passed! Authentication should work.");
    console.log("========================================");

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("[DEBUG] ✗ Error during test:", error.message);
    console.error("[DEBUG] Stack:", error.stack);
    console.log("========================================");

    return NextResponse.json({
      success: false,
      step: "exception",
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
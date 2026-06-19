import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "AGENT"]).default("AGENT"),
  phone: z.string().optional(),
  company: z.string().optional(),
  license: z.string().optional(),
  bio: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Normalize email to lowercase
    const email = validatedData.email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password with bcryptjs (pure JS — works in standalone builds)
    const hashedPassword = await hash(validatedData.password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        name: validatedData.name.trim(),
        email,
        password: hashedPassword,
        role: validatedData.role,
        phone: validatedData.phone?.trim() || null,
        company: validatedData.company?.trim() || null,
        license: validatedData.license?.trim() || null,
        bio: validatedData.bio?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        company: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { user, message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Register] Error:", error);
    console.error("[Register] Error name:", error?.name);
    console.error("[Register] Error message:", error?.message);
    console.error("[Register] Error stack:", error?.stack);

    if (error.name === "ZodError") {
      const firstError = error.issues?.[0]?.message || "Validation failed";
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      );
    }

    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}

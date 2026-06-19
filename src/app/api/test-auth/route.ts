import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: "Email et mot de passe requis",
      }, { status: 400 });
    }

    console.log("[TestAuth] Testing login for:", email);

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      console.log("[TestAuth] User not found");
      return NextResponse.json({
        success: false,
        error: "Utilisateur non trouvé",
        email: email,
      });
    }

    console.log("[TestAuth] User found:", user.email, "Role:", user.role);

    if (!user.password) {
      console.log("[TestAuth] No password (OAuth user)");
      return NextResponse.json({
        success: false,
        error: "Utilisateur OAuth (pas de mot de passe)",
      });
    }

    const isValid = await compare(password, user.password);

    if (!isValid) {
      console.log("[TestAuth] Invalid password");
      return NextResponse.json({
        success: false,
        error: "Mot de passe incorrect",
        passwordHashSample: user.password.substring(0, 20) + "...",
      });
    }

    console.log("[TestAuth] Login successful!");

    return NextResponse.json({
      success: true,
      message: "Authentification réussie!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("[TestAuth] Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

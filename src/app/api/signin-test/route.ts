import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint pour tester la connexion exactement comme le ferait le client
 * Simule ce que fait signIn("credentials", {...})
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("[SignInTest] Testing login for:", email);

    // Étape 1: Obtenir le CSRF token (comme le fait next-auth client)
    const csrfRes = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/csrf`, {
      method: "GET",
    });

    if (!csrfRes.ok) {
      return NextResponse.json({
        success: false,
        step: "csrf",
        error: "Failed to get CSRF token",
        status: csrfRes.status,
      });
    }

    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    const csrfCookie = csrfRes.headers.get("set-cookie");

    console.log("[SignInTest] CSRF token obtained:", csrfToken.substring(0, 20));

    // Étape 2: Appeler l'endpoint credentials (comme le fait signIn())
    const formData = new URLSearchParams({
      email,
      password,
      csrfToken,
      callbackUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
      json: "true",
    });

    const loginRes = await fetch(
      `${process.env.NEXTAUTH_URL}/api/auth/callback/credentials`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: csrfCookie || "",
        },
        body: formData.toString(),
      }
    );

    console.log("[SignInTest] Login response status:", loginRes.status);

    const loginData = await loginRes.json();
    const sessionCookie = loginRes.headers.get("set-cookie");

    console.log("[SignInTest] Login response:", loginData);
    console.log("[SignInTest] Session cookie set:", !!sessionCookie);

    if (!sessionCookie) {
      return NextResponse.json({
        success: false,
        step: "login",
        error: "No session cookie created",
        loginResponse: loginData,
        loginStatus: loginRes.status,
      });
    }

    // Étape 3: Vérifier la session
    const sessionRes = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/session`, {
      headers: {
        Cookie: sessionCookie,
      },
    });

    const session = await sessionRes.json();

    console.log("[SignInTest] Session:", session);

    return NextResponse.json({
      success: true,
      session,
      message: "Login simulation successful",
    });
  } catch (error: any) {
    console.error("[SignInTest] Error:", error);
    return NextResponse.json(
      {
        success: false,
        step: "exception",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
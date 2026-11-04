import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

/**
 * Route guard (edge). Role & agent status come from the signed JWT, which the server
 * re-syncs from the database every minute (see jwt callback in src/lib/auth.ts).
 *
 *  /dashboard/*   ADMIN, or AGENT whose profile is complete
 *  /onboarding/*  AGENT only
 *  /account/*     any signed-in user (clients' space), except /account/signin
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const redirect = (path: string) => NextResponse.redirect(new URL(path, req.url));

  if (pathname.startsWith("/account/signin")) {
    return token ? redirect("/account/messages") : NextResponse.next();
  }

  if (!token) {
    const callbackUrl = encodeURIComponent(pathname + search);
    const loginPage = pathname.startsWith("/account") ? "/account/signin" : "/auth/signin";
    return redirect(`${loginPage}?callbackUrl=${callbackUrl}`);
  }

  const role = token.role as string | undefined;
  const status = (token.agentStatus as string | undefined) ?? "ACTIVE";

  if (pathname.startsWith("/account")) return NextResponse.next();

  if (pathname.startsWith("/onboarding")) {
    if (role !== "AGENT") return redirect(role === "ADMIN" ? "/dashboard/admin" : "/account/messages");
    return NextResponse.next();
  }

  // /dashboard
  if (role === "CLIENT" || !role) return redirect("/account/messages");
  if (role === "AGENT") {
    if (status === "INCOMPLETE") return redirect("/onboarding/agent");
    if (pathname.startsWith("/dashboard/admin")) return redirect("/dashboard/agent");
  }
  if (role === "ADMIN" && pathname.startsWith("/dashboard/agent")) return redirect("/dashboard/admin");

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/account/:path*"],
};

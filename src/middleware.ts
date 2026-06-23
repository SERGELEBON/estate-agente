import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/dashboard") && token) {
      const role = token.role as string;

      if (role === "ADMIN" && pathname.startsWith("/dashboard/agent")) {
        return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      }

      if (role === "AGENT" && pathname.startsWith("/dashboard/admin")) {
        return NextResponse.redirect(new URL("/dashboard/agent", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/auth/signin",
    },
    callbacks: {
      authorized({ token }) {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};

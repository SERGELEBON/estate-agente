import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized({ token, req }) {
      const { pathname } = req.nextUrl;

      // Dashboard routes require authentication
      if (pathname.startsWith("/dashboard")) {
        // Admin-only routes
        if (pathname.startsWith("/dashboard/admin")) {
          return token?.role === "ADMIN";
        }
        // Agent and admin can access agent dashboard
        return !!token?.role;
      }

      return true;
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*"],
};

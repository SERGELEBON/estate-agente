import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";

// Build providers list dynamically
const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    id: "credentials",
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      try {
        console.log("[Auth] Authorize called with email:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("[Auth] Missing email or password");
          return null;
        }

        console.log("[Auth] Looking up user in database...");
        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          console.log("[Auth] User not found:", credentials.email);
          return null;
        }

        console.log("[Auth] User found:", user.email, "Has password:", !!user.password);

        if (!user.password) {
          console.log("[Auth] No password (OAuth user)");
          return null;
        }

        console.log("[Auth] Comparing passwords...");
        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          console.log("[Auth] Invalid password for:", credentials.email);
          return null;
        }

        console.log("[Auth] Login successful:", user.email, "Role:", user.role);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      } catch (error: any) {
        console.error("[Auth] Error in authorize:", error.message);
        console.error("[Auth] Error stack:", error.stack);
        return null;
      }
    },
  }),
];

// Only add Google provider if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Only add Facebook provider if credentials are configured
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  // IMPORTANT: Do NOT use PrismaAdapter when using JWT strategy with Credentials provider.
  // PrismaAdapter is designed for database sessions and OAuth providers.
  // With JWT strategy + Credentials, the adapter creates conflicts:
  //   - It tries to create Account records for credentials login (which fails)
  //   - It interferes with the JWT token flow
  //   - It causes signIn() to return errors even when authorize() succeeds
  // When OAuth is added later, we'll handle user creation manually in the signIn callback.
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On sign in, add role and id to token from the user object returned by authorize()
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.email = user.email;
      }

      // On session update, refresh the role from DB
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
    async signIn({ user, account }) {
      // For OAuth providers, ensure the user exists in our DB
      if (account?.provider !== "credentials" && user.email) {
        const existingUser = await db.user.findUnique({
          where: { email: user.email },
        });
        if (!existingUser) {
          // New OAuth user - create with AGENT role by default
          const newUser = await db.user.create({
            data: {
              email: user.email,
              name: user.name ?? "",
              image: user.image,
              role: "AGENT",
            },
          });
          // Update the user object with role for the JWT callback
          (user as any).role = newUser.role;
          (user as any).id = newUser.id;
        } else {
          // Update the user object with existing role for JWT callback
          (user as any).role = existingUser.role;
          (user as any).id = existingUser.id;
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // Invalid URL, fall through
      }
      // For credentials login with redirect:false, the client handles the redirect
      // For OAuth, we redirect to the homepage (client-side will route to dashboard)
      // Don't redirect to /dashboard here to avoid redirect loops with NextAuth
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET ?? "state-immocom-secret-key-dev-2024",
  debug: true,
};

// Export helper to check which OAuth providers are configured
export function isOAuthConfigured(provider: "google" | "facebook"): boolean {
  if (provider === "google") {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }
  if (provider === "facebook") {
    return !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET);
  }
  return false;
}

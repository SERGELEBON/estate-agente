import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { cookies } from "next/headers";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";
import { INTENT_COOKIE, normalizeEmail } from "@/lib/security";

export type Role = "ADMIN" | "AGENT" | "CLIENT";
export type AgentStatus = "INCOMPLETE" | "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED";

/** How often the JWT re-reads role/status from the DB, so admin decisions apply without re-login. */
const TOKEN_SYNC_MS = 60_000;

function readIntent(): "agent" | "client" {
  try {
    return cookies().get(INTENT_COOKIE)?.value === "agent" ? "agent" : "client";
  } catch {
    return "client";
  }
}

const providers: NextAuthOptions["providers"] = [
  // Agents / admins with a password
  CredentialsProvider({
    id: "credentials",
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      const user = await db.user.findUnique({ where: { email: normalizeEmail(credentials.email) } });
      if (!user?.password) return null;
      const valid = await compare(credentials.password, user.password);
      if (!valid) return null;
      return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role } as any;
    },
  }),

  // Clients: passwordless email code (works for iCloud, Outlook, Yahoo, company domains…)
  CredentialsProvider({
    id: "email-otp",
    name: "Email code",
    credentials: {
      email: { label: "Email", type: "email" },
      code: { label: "Code", type: "text" },
      name: { label: "Name", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.code) return null;
      const email = normalizeEmail(credentials.email);
      const ok = await verifyOtp(email, credentials.code);
      if (!ok) return null;

      const name = credentials.name?.trim().slice(0, 80) || null;
      const existing = await db.user.findUnique({ where: { email } });
      if (existing?.role === "AGENT" && existing.agentStatus === "SUSPENDED") return null;
      const user = existing
        ? await db.user.update({
            where: { id: existing.id },
            data: {
              emailVerified: existing.emailVerified ?? new Date(),
              ...(!existing.name && name ? { name } : {}),
            },
          })
        : await db.user.create({
            data: { email, name: name ?? email.split("@")[0], role: "CLIENT", emailVerified: new Date() },
          });
      return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role } as any;
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: "select_account" } },
    })
  );
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  // JWT sessions, no adapter: OAuth users are provisioned manually in the signIn callback.
  providers,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.type !== "oauth") return true;

      // Only accept Google accounts whose email Google has verified.
      if (account.provider === "google" && (profile as any)?.email_verified === false) return false;
      if (!user.email) return false;

      const email = normalizeEmail(user.email);
      let dbUser = await db.user.findUnique({ where: { email } });

      if (!dbUser) {
        const intent = readIntent();
        dbUser = await db.user.create({
          data: {
            email,
            name: user.name ?? email.split("@")[0],
            image: user.image,
            emailVerified: new Date(),
            role: intent === "agent" ? "AGENT" : "CLIENT",
            agentStatus: intent === "agent" ? "INCOMPLETE" : "ACTIVE",
          },
        });
      } else if (!dbUser.image || !dbUser.emailVerified) {
        dbUser = await db.user.update({
          where: { id: dbUser.id },
          data: { image: dbUser.image ?? user.image, emailVerified: dbUser.emailVerified ?? new Date() },
        });
      }

      if (dbUser.role === "AGENT" && dbUser.agentStatus === "SUSPENDED") {
        return "/auth/signin?error=AccountSuspended";
      }

      (user as any).id = dbUser.id;
      (user as any).role = dbUser.role;
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.syncedAt = 0; // force a DB sync below
      }

      const stale = !token.syncedAt || Date.now() - (token.syncedAt as number) > TOKEN_SYNC_MS;
      if (token.id && (stale || trigger === "update")) {
        // Never trust client-provided values on update(): always re-read from the DB.
        const fresh = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, agentStatus: true, name: true, image: true, email: true },
        });
        if (!fresh) return { ...token, id: undefined, role: undefined };
        token.role = fresh.role as Role;
        token.agentStatus = fresh.agentStatus as AgentStatus;
        token.name = fresh.name;
        token.picture = fresh.image;
        token.email = fresh.email;
        token.syncedAt = Date.now();
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).agentStatus = token.agentStatus ?? "ACTIVE";
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.image = (token.picture as string) ?? session.user.image;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {}
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== "production",
};

export function isOAuthConfigured(provider: "google" | "facebook"): boolean {
  if (provider === "google") return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET);
}

/** Server helper: current user identity from the session, or null. */
export async function getSessionUser() {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  const u = session?.user as any;
  if (!u?.id) return null;
  return {
    id: u.id as string,
    role: u.role as Role,
    agentStatus: (u.agentStatus ?? "ACTIVE") as AgentStatus,
    name: (u.name as string | null) ?? null,
    email: (u.email as string | null) ?? null,
  };
}

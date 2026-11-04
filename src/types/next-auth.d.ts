import "next-auth";
import "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "AGENT" | "CLIENT";
    agentStatus?: "INCOMPLETE" | "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED";
    syncedAt?: number;
  }
}

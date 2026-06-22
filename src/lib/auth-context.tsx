"use client";

import { SessionProvider, useSession as nextAuthUseSession } from "next-auth/react";
import { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={0}
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}

export function useAuth() {
  const { data: session, status } = nextAuthUseSession();
  return {
    user: session?.user ?? null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    role: (session?.user as any)?.role ?? null,
    userId: (session?.user as any)?.id ?? null,
  };
}

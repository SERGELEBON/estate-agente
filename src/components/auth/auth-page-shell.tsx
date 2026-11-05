"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

/** Branded full-screen layout shared by the agent sign-in and sign-up pages. */
export function AuthPageShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(135deg, #2E8B57 0%, #1a5c38 50%, #0f3d25 100%)" }}
    >
      <div className="w-full max-w-md space-y-5">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Image src="/logo.png" alt="State-ImmoCom" width={44} height={44} className="h-11 w-auto rounded-md bg-white p-1" />
          <div className="leading-tight">
            <span className="block text-xl font-bold text-white">State-ImmoCom</span>
            <span className="block text-[9px] font-semibold tracking-widest" style={{ color: "#F4C430" }}>
              BUY &bull; RENT &bull; INVEST
            </span>
          </div>
        </Link>
        <Card className="shadow-2xl">
          <CardContent className="p-6">{children}</CardContent>
        </Card>
        {footer && <div className="text-center text-sm text-white/85">{footer}</div>}
      </div>
    </div>
  );
}

export const OAUTH_ERRORS: Record<string, string> = {
  AccountSuspended: "This agent account is suspended. Please contact State-ImmoCom support.",
  AccessDenied: "Sign-in was cancelled or your account has no verified email.",
  OAuthAccountNotLinked: "This email is already registered with another sign-in method.",
  OAuthSignin: "Couldn't reach the provider. Please try again.",
  OAuthCallback: "Sign-in failed. Please try again.",
  Callback: "Sign-in failed. Please try again.",
  Configuration: "This sign-in method is temporarily unavailable. Use your email instead.",
};

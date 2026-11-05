"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthPageShell, OAUTH_ERRORS } from "@/components/auth/auth-page-shell";

function safeCallback(raw: string | null) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/auth/") ? raw : "/dashboard";
}

function SignIn() {
  const params = useSearchParams();
  const { status } = useSession();
  const callbackUrl = safeCallback(params?.get("callbackUrl") ?? null);
  const errorCode = params?.get("error");

  // Already signed in → /dashboard routes each role (admin, agent, onboarding, client).
  useEffect(() => {
    if (status === "authenticated") window.location.replace(callbackUrl);
  }, [status, callbackUrl]);

  return (
    <AuthPageShell
      footer={
        <>
          New agent?{" "}
          <Link href="/auth/register" className="font-semibold text-white underline-offset-4 hover:underline">
            Create your agent account
          </Link>
          <span className="mx-2 opacity-60">·</span>
          Looking for a property?{" "}
          <Link href="/account/signin" className="font-semibold text-white underline-offset-4 hover:underline">
            Client sign-in
          </Link>
        </>
      }
    >
      {errorCode && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {OAUTH_ERRORS[errorCode] ?? "Sign-in failed. Please try again."}
        </p>
      )}
      <AuthPanel
        intent="agent"
        mode="signin"
        allowPassword
        callbackUrl={callbackUrl}
        title="Agent sign-in"
        subtitle="Sign in to manage your listings, visits and client messages."
        onSignedIn={() => window.location.assign(callbackUrl)}
      />
    </AuthPageShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}

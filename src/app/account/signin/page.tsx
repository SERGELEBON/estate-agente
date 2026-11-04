"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AuthPanel } from "@/components/auth/auth-panel";

function ClientSignIn() {
  const router = useRouter();
  const params = useSearchParams();
  const { update } = useSession();
  const raw = params?.get("callbackUrl") ?? "/account/messages";
  const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account/messages";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Image src="/logo.png" alt="State-ImmoCom" width={36} height={36} className="h-9 w-auto" />
          <span className="text-xl font-bold" style={{ color: "#2E8B57" }}>
            State-ImmoCom
          </span>
        </Link>
        <Card>
          <CardContent className="p-6">
            <AuthPanel
              intent="client"
              title="Sign in to your client space"
              subtitle="Chat with agents, follow your inquiries and get notified when they reply."
              callbackUrl={callbackUrl}
              onSignedIn={async () => {
                await update();
                router.replace(callbackUrl);
                router.refresh();
              }}
            />
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          Are you a real estate agent?{" "}
          <Link href="/auth/signin" className="font-medium hover:underline" style={{ color: "#2E8B57" }}>
            Go to the agent portal
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ClientSignInPage() {
  return (
    <Suspense>
      <ClientSignIn />
    </Suspense>
  );
}

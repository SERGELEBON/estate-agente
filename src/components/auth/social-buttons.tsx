"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export function FacebookLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.07C24 5.44 18.63.07 12 .07S0 5.44 0 12.07C0 18.06 4.39 23.03 10.13 23.93v-8.39H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.23 2.69.23v2.95h-1.51c-1.49 0-1.96.93-1.96 1.87v2.26h3.33l-.53 3.47h-2.8v8.39C19.61 23.03 24 18.06 24 12.07z" />
    </svg>
  );
}

type Provider = "google" | "facebook";

let providersCache: Promise<Record<string, unknown> | null> | null = null;
/** Which OAuth providers the server actually has credentials for (cached per page load). */
export function useOAuthProviders() {
  const [available, setAvailable] = useState<{ google: boolean; facebook: boolean } | null>(null);
  useEffect(() => {
    providersCache ??= getProviders().catch(() => null) as Promise<Record<string, unknown> | null>;
    providersCache.then((p) => setAvailable({ google: !!p?.google, facebook: !!p?.facebook }));
  }, []);
  return available;
}

/** Remembers whether a brand-new OAuth user should become an agent or a client. */
export async function setAuthIntent(intent: "agent" | "client" | "school") {
  await fetch("/api/auth/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intent }),
  }).catch(() => undefined);
}

interface Props {
  intent: "agent" | "client";
  callbackUrl: string;
  /** Prefix for the button label, e.g. "Continue with" or "Sign up with". */
  verb?: string;
  onBeforeRedirect?: () => void;
  loginHint?: string;
  className?: string;
  /** Rendered only when at least one provider is available (e.g. a divider). */
  header?: React.ReactNode;
}

/**
 * Social sign-in buttons. Only providers that are configured on the server are shown —
 * never a disabled/greyed button.
 */
export function SocialButtons({ intent, callbackUrl, verb = "Continue with", onBeforeRedirect, loginHint, className, header }: Props) {
  const available = useOAuthProviders();
  const [busy, setBusy] = useState<Provider | null>(null);

  if (!available || (!available.google && !available.facebook)) return null;

  const go = async (provider: Provider) => {
    setBusy(provider);
    onBeforeRedirect?.();
    await setAuthIntent(intent);
    await signIn(provider, { callbackUrl }, provider === "google" && loginHint ? { login_hint: loginHint } : undefined);
  };

  return (
    <>
      {header}
      <div className={cn("grid gap-2", available.google && available.facebook && "sm:grid-cols-2", className)}>
        {available.google && (
          <Button type="button" variant="outline" className="h-11 w-full gap-2" disabled={!!busy} onClick={() => go("google")}>
            {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleLogo className="h-4 w-4" />}
            {verb} Google
          </Button>
        )}
        {available.facebook && (
          <Button type="button" variant="outline" className="h-11 w-full gap-2" disabled={!!busy} onClick={() => go("facebook")}>
            {busy === "facebook" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FacebookLogo className="h-4 w-4" />}
            {verb} Facebook
          </Button>
        )}
      </div>
    </>
  );
}

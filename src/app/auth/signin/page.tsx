"use client";

import { SocialButtons } from "@/components/auth/social-buttons";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn, useSession, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, EyeOff, AlertCircle, Settings } from "lucide-react";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<Record<string, any>>({});
  const router = useRouter();
  const { data: session, status } = useSession();

  // Clean up corrupted callbackUrl from redirect loops
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const callbackUrl = url.searchParams.get("callbackUrl");

      // If callbackUrl points back to signin (redirect loop), remove it
      if (callbackUrl && callbackUrl.includes("/auth/signin")) {
        console.log("[SignIn] Removing corrupted callbackUrl:", callbackUrl);
        url.searchParams.delete("callbackUrl");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

  // If already authenticated, redirect to the correct dashboard
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // /dashboard routes each role (admin, agent, agent onboarding, client) server-side
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  // Surface NextAuth errors passed back in the URL (?error=...)
  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get("error");
    if (!code) return;
    const messages: Record<string, string> = {
      AccountSuspended: "This agent account is suspended. Please contact State-ImmoCom support.",
      AccessDenied: "Access denied. Please use a verified Google account.",
      OAuthAccountNotLinked: "This email is already registered with another sign-in method.",
      Callback: "Google sign-in failed. Please try again.",
    };
    setError(messages[code] ?? "Sign-in failed. Please try again.");
  }, []);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((data) => setOauthProviders(data))
      .catch(() => {});
  }, []);

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("[SignIn] Attempting manual login for:", email);

      // Step 1: Get CSRF token
      const csrfRes = await fetch("/api/auth/csrf");
      const csrfData = await csrfRes.json();
      console.log("[SignIn] CSRF token obtained");

      // Step 2: Manual login via NextAuth credentials endpoint
      const formData = new URLSearchParams({
        email,
        password,
        csrfToken: csrfData.csrfToken,
        callbackUrl: "/dashboard",
        json: "true",
      });

      const loginRes = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        credentials: "include",
      });

      console.log("[SignIn] Login response status:", loginRes.status);

      if (!loginRes.ok) {
        console.error("[SignIn] Login request failed");
        setError("La connexion a échoué. Vérifiez vos identifiants.");
        setLoading(false);
        return;
      }

      const loginData = await loginRes.json();
      console.log("[SignIn] Login response:", loginData);

      // Step 3: Check session
      const sessionRes = await fetch("/api/auth/session", {
        credentials: "include",
      });

      if (!sessionRes.ok) {
        console.error("[SignIn] Session fetch failed");
        setError("Impossible de créer la session.");
        setLoading(false);
        return;
      }

      const sessionData = await sessionRes.json();
      console.log("[SignIn] Session data:", sessionData);

      if (!sessionData || !sessionData.user) {
        console.error("[SignIn] No user in session");
        setError("Email ou mot de passe incorrect.");
        setLoading(false);
        return;
      }

      // Success! Redirect based on role
      const role = sessionData.user.role;
      console.log("[SignIn] Login successful! Role:", role);

      const dashboardUrl = "/dashboard";
      console.log("[SignIn] Redirecting to:", dashboardUrl);

      // Force NextAuth to refresh the session on the client side
      await getSession();

      // Use full page reload to ensure session is properly loaded
      window.location.href = dashboardUrl;
    } catch (err) {
      console.error("[SignIn] Exception during login:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    // New Google accounts created from the agent portal become agents (profile + verification required).
    await fetch("/api/auth/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "agent" }),
    }).catch(() => undefined);
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  const hasGoogle = !!oauthProviders.google;
  const hasFacebook = !!oauthProviders.facebook;
  const showOAuthSetupHint = !hasGoogle && !hasFacebook;

  // If session is loading, show a brief loading state
  if (status === "loading") {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #2E8B57 0%, #1a5c38 50%, #0f3d25 100%)",
        }}
      >
        <div className="animate-pulse text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-white/20" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, show redirecting state
  if (status === "authenticated") {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #2E8B57 0%, #1a5c38 50%, #0f3d25 100%)",
        }}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
          <p className="text-white/70">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{
        background: "linear-gradient(135deg, #2E8B57 0%, #1a5c38 50%, #0f3d25 100%)",
      }}
    >
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-2">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <Image
              src="/logo.png"
              alt="State-ImmoCom Logo"
              width={56}
              height={56}
              className="h-14 w-auto"
            />
            <div className="flex flex-col leading-tight text-left">
              <span
                className="text-xl font-bold tracking-tight"
                style={{ color: "#2E8B57" }}
              >
                State-ImmoCom
              </span>
              <span
                className="text-[9px] font-semibold tracking-widest"
                style={{ color: "#F4C430" }}
              >
                BUY &bull; RENT &bull; INVEST
              </span>
            </div>
          </Link>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full text-white hover:opacity-90"
              style={{ backgroundColor: "#2E8B57" }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <SocialButtons
            intent="agent"
            callbackUrl="/dashboard"
            verb="Continue with"
            header={
              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                  Or continue with
                </span>
              </div>
            }
          />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium hover:underline"
              style={{ color: "#2E8B57" }}
            >
              Register as Agent
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Looking for a property?{" "}
            <Link href="/account/signin" className="font-medium hover:underline" style={{ color: "#2E8B57" }}>
              Client sign-in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #2E8B57 0%, #1a5c38 50%, #0f3d25 100%)",
        }}
      >
        <div className="animate-pulse text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-white/20" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}

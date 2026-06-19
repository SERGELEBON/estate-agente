"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
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

  // If already authenticated, redirect to the correct dashboard
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role;
      if (role === "ADMIN") {
        router.replace("/dashboard/admin");
      } else {
        router.replace("/dashboard/agent");
      }
    }
  }, [status, session, router]);

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
      console.log("[SignIn] Attempting login for:", email);

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log("[SignIn] SignIn result:", result);

      if (result?.error) {
        console.error("[SignIn] Error from signIn:", result.error);
        setError("Email ou mot de passe incorrect. Veuillez réessayer.");
        setLoading(false);
        return;
      }

      if (!result?.ok) {
        console.error("[SignIn] SignIn not ok:", result);
        setError("La connexion a échoué. Veuillez réessayer.");
        setLoading(false);
        return;
      }

      console.log("[SignIn] Login successful, fetching session...");

      // After successful login, fetch session to get the role
      // then redirect directly to the correct dashboard
      const sessionRes = await fetch("/api/auth/session");
      console.log("[SignIn] Session response status:", sessionRes.status);

      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        console.log("[SignIn] Session data:", sessionData);
        const role = sessionData?.user?.role;

        if (role === "ADMIN") {
          console.log("[SignIn] Redirecting to admin dashboard");
          router.replace("/dashboard/admin");
        } else {
          console.log("[SignIn] Redirecting to agent dashboard");
          router.replace("/dashboard/agent");
        }
      } else {
        console.log("[SignIn] Session fetch failed, using fallback redirect");
        // Fallback: redirect to /dashboard which handles role-based routing
        router.replace("/dashboard");
      }
    } catch (err) {
      console.error("[SignIn] Exception during login:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  };

  const handleOAuthSignIn = (provider: string) => {
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

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              Or continue with
            </span>
          </div>

          <div className="space-y-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block w-full" tabIndex={!hasGoogle ? 0 : undefined}>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleOAuthSignIn("google")}
                      disabled={!hasGoogle}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Google
                      {!hasGoogle && (
                        <span className="text-xs text-muted-foreground ml-1">(Not configured)</span>
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!hasGoogle && (
                  <TooltipContent>
                    <p>Google sign-in requires OAuth credentials.</p>
                    <p className="text-xs mt-1">Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block w-full" tabIndex={!hasFacebook ? 0 : undefined}>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleOAuthSignIn("facebook")}
                      disabled={!hasFacebook}
                    >
                      <svg className="h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                      {!hasFacebook && (
                        <span className="text-xs text-muted-foreground ml-1">(Not configured)</span>
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!hasFacebook && (
                  <TooltipContent>
                    <p>Facebook sign-in requires OAuth credentials.</p>
                    <p className="text-xs mt-1">Add FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET to your .env file.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <Button variant="outline" className="w-full gap-2" disabled>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Apple (Coming Soon)
            </Button>
          </div>

          {showOAuthSetupHint && (
            <div className="mt-4 rounded-md bg-muted p-3 flex items-start gap-2">
              <Settings className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Social login buttons are disabled because OAuth credentials are not configured.
                Add Google/Facebook client IDs and secrets to the <code className="font-mono bg-muted-foreground/10 px-1 rounded">.env</code> file to enable them.
              </p>
            </div>
          )}

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

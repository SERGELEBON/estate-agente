"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { FacebookLogo, GoogleLogo, setAuthIntent, useOAuthProviders } from "@/components/auth/social-buttons";

const GOOGLE_DOMAINS = ["gmail.com", "googlemail.com"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface AuthPanelProps {
  /** Which kind of account a NEW user gets. Existing users keep their role. */
  intent: "agent" | "client";
  /** "signup" also asks for the user's name. */
  mode?: "signin" | "signup";
  /** Where Google/Facebook send the user back after authenticating. */
  callbackUrl: string;
  /** Called after a successful email-code (or password) sign-in. */
  onSignedIn?: () => void | Promise<void>;
  /** Called right before leaving the page for Google/Facebook (e.g. to save a draft). */
  onBeforeRedirect?: () => void;
  /** Show the "sign in with a password" fallback (agents / admin with an existing password). */
  allowPassword?: boolean;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

type Step = "start" | "code" | "password";
type Busy = "google" | "facebook" | "send" | "verify" | "password" | null;

/**
 * One sign-in / sign-up form for everyone:
 *  1. "Continue with Google" and "Continue with Facebook" — always active.
 *  2. Or type your email: Gmail → Google; any other inbox (iCloud, Yahoo, Outlook,
 *     company…) → we email a 6-digit code. No password needed.
 */
export function AuthPanel({
  intent,
  mode = "signin",
  callbackUrl,
  onSignedIn,
  onBeforeRedirect,
  allowPassword,
  title,
  subtitle,
  compact,
}: AuthPanelProps) {
  const providers = useOAuthProviders();
  const [step, setStep] = useState<Step>("start");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanEmail = email.trim().toLowerCase();
  const isGmail = GOOGLE_DOMAINS.includes(cleanEmail.split("@")[1] ?? "");
  const emailValid = EMAIL_RE.test(cleanEmail);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const startCountdown = (seconds: number) => {
    setResendIn(seconds);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1 && timer.current) clearInterval(timer.current);
        return Math.max(0, s - 1);
      });
    }, 1000);
  };

  const social = async (provider: "google" | "facebook") => {
    setError(null);
    // Providers still loading → assume available; the server is the source of truth.
    if (providers && !providers[provider]) {
      setError(
        `${provider === "google" ? "Google" : "Facebook"} sign-in is temporarily unavailable. ` +
          "Enter your email below and we'll send you a code instead."
      );
      return;
    }
    setBusy(provider);
    onBeforeRedirect?.();
    await setAuthIntent(intent);
    await signIn(provider, { callbackUrl }, provider === "google" && isGmail ? { login_hint: cleanEmail } : undefined);
  };

  const sendCode = async () => {
    if (!emailValid) return setError("Please enter a valid email address.");
    setBusy("send");
    setError(null);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "We couldn't send the code. Please try again.");
        if (res.status === 429 && data.retryAfter && data.retryAfter < 120) {
          setStep("code");
          startCountdown(data.retryAfter);
        }
        return;
      }
      setCode("");
      setStep("code");
      startCountdown(data.resendIn ?? 60);
    } finally {
      setBusy(null);
    }
  };

  /** Email submitted: Gmail goes straight to Google, every other inbox gets a code. */
  const continueWithEmail = () => {
    if (!emailValid) return setError("Please enter a valid email address.");
    if (mode === "signup" && name.trim().length < 2) return setError("Please enter your name.");
    if (isGmail && providers?.google) return social("google");
    return sendCode();
  };

  const verify = async (value = code) => {
    if (value.length !== 6) return;
    setBusy("verify");
    setError(null);
    const res = await signIn("email-otp", { email: cleanEmail, code: value, name: name.trim(), intent, redirect: false });
    if (!res || res.error) {
      setBusy(null);
      setCode("");
      return setError("This code is incorrect or has expired. Check your inbox or request a new one.");
    }
    await onSignedIn?.();
    setBusy(null);
  };

  const passwordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("password");
    setError(null);
    const res = await signIn("credentials", { email: cleanEmail, password, redirect: false });
    if (!res || res.error) {
      setBusy(null);
      return setError("Incorrect email or password.");
    }
    await onSignedIn?.();
    setBusy(null);
  };

  const gap = compact ? "space-y-3" : "space-y-4";

  return (
    <div className={cn("w-full", gap)}>
      {(title || subtitle) && (
        <div className="space-y-1">
          {title && <h3 className={cn("font-semibold text-foreground", compact ? "text-base" : "text-xl")}>{title}</h3>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      {step === "start" && (
        <>
          <div className="grid gap-2">
            <Button type="button" variant="outline" className="h-11 w-full gap-2 font-medium" disabled={!!busy} onClick={() => social("google")}>
              {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleLogo className="h-4 w-4" />}
              Continue with Google
            </Button>
            <Button type="button" variant="outline" className="h-11 w-full gap-2 font-medium" disabled={!!busy} onClick={() => social("facebook")}>
              {busy === "facebook" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FacebookLogo className="h-4 w-4" />}
              Continue with Facebook
            </Button>
          </div>

          <div className="relative py-1 text-center text-xs text-muted-foreground">
            <span className="relative z-10 bg-card px-2">or use your email (iCloud, Yahoo, Outlook…)</span>
            <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
          </div>

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              continueWithEmail();
            }}
          >
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-name">Full name</Label>
                <Input id="auth-name" autoComplete="name" placeholder="Ama Mensah" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="auth-email">Email address</Label>
              <Input
                id="auth-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="you@icloud.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
              />
              {isGmail && providers?.google && (
                <p className="text-xs text-muted-foreground">Gmail address detected — you'll continue with Google, no code needed.</p>
              )}
            </div>
            <Button type="submit" className="h-11 w-full gap-2 text-white" style={{ backgroundColor: "#2E8B57" }} disabled={!!busy || !emailValid}>
              {busy === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : isGmail && providers?.google ? <GoogleLogo className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              {isGmail && providers?.google ? "Continue with Google" : "Email me a sign-in code"}
            </Button>
            {isGmail && providers?.google && (
              <button type="button" onClick={sendCode} disabled={!!busy} className="w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline">
                Send me a code instead
              </button>
            )}
          </form>

          {allowPassword && (
            <button
              type="button"
              onClick={() => {
                setStep("password");
                setError(null);
              }}
              className="inline-flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <KeyRound className="h-3.5 w-3.5" /> I have a password
            </button>
          )}
        </>
      )}

      {step === "code" && (
        <div className="space-y-4">
          <button type="button" onClick={() => { setStep("start"); setError(null); }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Change email
          </button>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <span className="font-medium text-foreground">{cleanEmail}</span>. It expires in 10 minutes —
            check your spam folder if you don't see it.
          </p>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={busy === "verify"}
              onChange={(v) => {
                const digits = v.replace(/\D/g, "");
                setCode(digits);
                setError(null);
                if (digits.length === 6) verify(digits);
              }}
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} className="h-11 w-10 text-lg" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button className="h-11 w-full gap-2 text-white" style={{ backgroundColor: "#2E8B57" }} disabled={code.length !== 6 || busy === "verify"} onClick={() => verify()}>
            {busy === "verify" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Verify and continue
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Didn't get it?{" "}
            {resendIn > 0 ? (
              <span>Resend in {resendIn}s</span>
            ) : (
              <button type="button" className="font-medium text-foreground hover:underline" onClick={sendCode} disabled={!!busy}>
                {busy === "send" ? "Sending…" : "Resend code"}
              </button>
            )}
          </p>
        </div>
      )}

      {step === "password" && (
        <form onSubmit={passwordSignIn} className="space-y-3">
          <button type="button" onClick={() => { setStep("start"); setError(null); }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Other sign-in options
          </button>
          <div className="space-y-1.5">
            <Label htmlFor="pw-email">Email address</Label>
            <Input id="pw-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-password">Password</Label>
            <Input id="pw-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="h-11 w-full text-white" style={{ backgroundColor: "#2E8B57" }} disabled={!!busy || !emailValid || !password}>
            {busy === "password" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        No password needed. By continuing you agree to our terms and{" "}
        <a href="/privacy" className="underline">privacy policy</a>.
      </p>
    </div>
  );
}

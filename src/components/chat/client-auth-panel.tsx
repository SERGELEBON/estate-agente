"use client";

import { useEffect, useRef, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { ArrowLeft, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

const GOOGLE_DOMAINS = ["gmail.com", "googlemail.com"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

interface Props {
  /** Where Google should send the user back (OTP sign-in stays on the page). */
  callbackUrl: string;
  /** Called after a successful email-code sign-in. */
  onSignedIn?: () => void | Promise<void>;
  /** Called right before redirecting to Google (e.g. to persist a draft). */
  onBeforeGoogle?: () => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

type Step = "email" | "code";

/**
 * Passwordless client sign-in:
 *  - Gmail addresses are offered "Continue with Google" first (one tap, no code).
 *  - Any other address (iCloud, Outlook, Yahoo, company…) receives a 6-digit code by email.
 */
export function ClientAuthPanel({ callbackUrl, onSignedIn, onBeforeGoogle, title, subtitle, compact }: Props) {
  const [step, setStep] = useState<Step>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"google" | "send" | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  const isGmail = GOOGLE_DOMAINS.includes(domain);
  const emailValid = EMAIL_RE.test(email.trim());

  useEffect(() => {
    getProviders().then((p) => setGoogleEnabled(!!p?.google)).catch(() => undefined);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
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

  const continueWithGoogle = async () => {
    setBusy("google");
    setError(null);
    onBeforeGoogle?.();
    await fetch("/api/auth/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "client" }),
    }).catch(() => undefined);
    await signIn("google", { callbackUrl }, isGmail ? { login_hint: email.trim() } : undefined);
  };

  const sendCode = async () => {
    if (!emailValid) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy("send");
    setError(null);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "We couldn't send the code. Please try again.");
        if (data.retryAfter && data.retryAfter < 120) {
          setStep("code");
          startCountdown(data.retryAfter);
        }
        return;
      }
      setStep("code");
      setCode("");
      startCountdown(data.resendIn ?? 60);
    } finally {
      setBusy(null);
    }
  };

  const verify = async (value = code) => {
    if (value.length !== 6) return;
    setBusy("verify");
    setError(null);
    const res = await signIn("email-otp", {
      email: email.trim(),
      code: value,
      name: name.trim(),
      redirect: false,
    });
    if (!res || res.error) {
      setBusy(null);
      setCode("");
      setError("This code is incorrect or has expired. Check your inbox or request a new one.");
      return;
    }
    await onSignedIn?.();
    setBusy(null);
  };

  return (
    <div className={cn("w-full", compact ? "space-y-3" : "space-y-5")}>
      {(title || subtitle) && (
        <div className="space-y-1">
          {title && <h3 className={cn("font-semibold text-foreground", compact ? "text-base" : "text-xl")}>{title}</h3>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      {step === "email" ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (isGmail && googleEnabled) continueWithGoogle();
            else sendCode();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="auth-name">Your name</Label>
              <Input
                id="auth-name"
                autoComplete="name"
                placeholder="Ama Mensah"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
            </div>
          </div>

          {isGmail && googleEnabled ? (
            <div className="space-y-2">
              <Button type="submit" variant="outline" className="w-full gap-2 h-11" disabled={!!busy}>
                {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
                Continue with Google
              </Button>
              <button
                type="button"
                onClick={sendCode}
                disabled={!!busy}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                {busy === "send" ? "Sending…" : "Email me a code instead"}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full gap-2 h-11 text-white"
                style={{ backgroundColor: "#2E8B57" }}
                disabled={!!busy || !emailValid}
              >
                {busy === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Send me a verification code
              </Button>
              {googleEnabled && (
                <>
                  <div className="relative py-1 text-center text-xs text-muted-foreground">
                    <span className="relative z-10 bg-card px-2">or</span>
                    <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
                  </div>
                  <Button type="button" variant="outline" className="w-full gap-2 h-11" onClick={continueWithGoogle} disabled={!!busy}>
                    {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
                    Continue with Google
                  </Button>
                </>
              )}
            </div>
          )}
        </form>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError(null);
            }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Change email
          </button>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <span className="font-medium text-foreground">{email.trim()}</span>. It
            expires in 10 minutes — check your spam folder if you don't see it.
          </p>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              onChange={(v) => {
                const digits = v.replace(/\D/g, "");
                setCode(digits);
                setError(null);
                if (digits.length === 6) verify(digits);
              }}
              disabled={busy === "verify"}
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} className="h-11 w-10 text-lg" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button
            className="w-full gap-2 h-11 text-white"
            style={{ backgroundColor: "#2E8B57" }}
            disabled={code.length !== 6 || busy === "verify"}
            onClick={() => verify()}
          >
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

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        No password needed. By continuing you agree to our terms and privacy policy. We only use your email to
        connect you with agents.
      </p>
    </div>
  );
}

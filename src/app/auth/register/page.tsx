"use client";

import { Suspense } from "react";
import Link from "next/link";
import { BadgeCheck, Building2, UserRound } from "lucide-react";
import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthPageShell } from "@/components/auth/auth-page-shell";

const STEPS = [
  { icon: UserRound, text: "Create your account with Google, Facebook or your email" },
  { icon: Building2, text: "Complete your agent profile (phone, licence, areas)" },
  { icon: BadgeCheck, text: "Our team verifies you — then publish and chat with clients" },
];

function Register() {
  return (
    <AuthPageShell
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/signin" className="font-semibold text-white underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <ol className="mb-5 space-y-2">
        {STEPS.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <s.icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#2E8B57" }} />
            {s.text}
          </li>
        ))}
      </ol>
      <AuthPanel
        intent="agent"
        mode="signup"
        callbackUrl="/dashboard"
        title="Become a State-ImmoCom agent"
        subtitle="For real estate professionals. Clients don't need an account to browse."
        onSignedIn={() => window.location.assign("/dashboard")}
      />
    </AuthPageShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <Register />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import Link from "next/link";
import { BadgeCheck, MessageCircle, Star, Users } from "lucide-react";
import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthPageShell } from "@/components/auth/auth-page-shell";

const BENEFITS = [
  { icon: Users, text: "Reach English and French learners in Ghana and francophone Africa" },
  { icon: Star, text: "Collect verified student reviews and star ratings" },
  { icon: MessageCircle, text: "Chat with prospective students from your dashboard" },
  { icon: BadgeCheck, text: "Free listing — reviewed by our team before going live" },
];

function Join() {
  return (
    <AuthPageShell
      footer={
        <>
          Already listed?{" "}
          <Link href="/auth/signin?callbackUrl=%2Fdashboard%2Fschool" className="font-semibold text-white underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <ul className="mb-5 space-y-2">
        {BENEFITS.map((b) => (
          <li key={b.text} className="flex items-start gap-2 text-xs text-muted-foreground">
            <b.icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#2E8B57" }} /> {b.text}
          </li>
        ))}
      </ul>
      <AuthPanel
        intent="school"
        mode="signup"
        callbackUrl="/dashboard/school"
        title="List your language school"
        subtitle="Create your school account with Google, Facebook or your email."
        onSignedIn={() => window.location.assign("/dashboard/school")}
      />
    </AuthPageShell>
  );
}

export default function SchoolJoinPage() {
  return (
    <Suspense>
      <Join />
    </Suspense>
  );
}

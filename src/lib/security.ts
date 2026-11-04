import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s && process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET must be set in production");
  }
  return s ?? "dev-only-secret";
}

/** Keyed hash, used for OTP codes and IP addresses (never stored in clear). */
export function hmac(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function clientIp(request: NextRequest | Request): string {
  const h = request.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export function ipHash(request: NextRequest | Request): string {
  return hmac(`ip:${clientIp(request)}`);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const GOOGLE_EMAIL_DOMAINS = ["gmail.com", "googlemail.com"];

export function isGoogleEmail(email: string): boolean {
  const domain = normalizeEmail(email).split("@")[1] ?? "";
  return GOOGLE_EMAIL_DOMAINS.includes(domain);
}

/** Cookie that remembers the guest's first conversation until they verify their email. */
export const GUEST_COOKIE = "sic_guest_chat";
/** Cookie that tells the OAuth callback whether a new Google user is an agent or a client. */
export const INTENT_COOKIE = "sic_auth_intent";

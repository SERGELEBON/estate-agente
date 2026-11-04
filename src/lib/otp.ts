import { randomInt } from "crypto";
import { db } from "@/lib/db";
import { hmac, normalizeEmail, safeEqualHex } from "@/lib/security";

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_SECONDS = 60;
const MAX_PER_EMAIL_PER_HOUR = 5;
const MAX_PER_IP_PER_HOUR = 20;

function hashCode(email: string, code: string) {
  return hmac(`otp:${normalizeEmail(email)}:${code}`);
}

export type OtpRequestResult =
  | { ok: true; code: string }
  | { ok: false; reason: "TOO_SOON" | "RATE_LIMITED"; retryAfter: number };

/** Creates a fresh 6-digit code (invalidating older ones) after applying rate limits. */
export async function createOtp(rawEmail: string, ipHash: string): Promise<OtpRequestResult> {
  const email = normalizeEmail(rawEmail);
  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000);

  const [last, perEmail, perIp] = await Promise.all([
    db.emailOtp.findFirst({ where: { email }, orderBy: { createdAt: "desc" } }),
    db.emailOtp.count({ where: { email, createdAt: { gte: hourAgo } } }),
    db.emailOtp.count({ where: { ipHash, createdAt: { gte: hourAgo } } }),
  ]);

  if (last) {
    const elapsed = (now - last.createdAt.getTime()) / 1000;
    if (elapsed < OTP_RESEND_SECONDS) {
      return { ok: false, reason: "TOO_SOON", retryAfter: Math.ceil(OTP_RESEND_SECONDS - elapsed) };
    }
  }
  if (perEmail >= MAX_PER_EMAIL_PER_HOUR || perIp >= MAX_PER_IP_PER_HOUR) {
    return { ok: false, reason: "RATE_LIMITED", retryAfter: 3600 };
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");

  await db.$transaction([
    db.emailOtp.updateMany({
      where: { email, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    db.emailOtp.create({
      data: {
        email,
        ipHash,
        codeHash: hashCode(email, code),
        expiresAt: new Date(now + OTP_TTL_MINUTES * 60 * 1000),
      },
    }),
  ]);

  return { ok: true, code };
}

/** Verifies and consumes a code. Wrong guesses are counted; the code dies after OTP_MAX_ATTEMPTS. */
export async function verifyOtp(rawEmail: string, rawCode: string): Promise<boolean> {
  const email = normalizeEmail(rawEmail);
  const code = rawCode.replace(/\D/g, "");
  if (code.length !== 6) return false;

  const otp = await db.emailOtp.findFirst({
    where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.attempts >= OTP_MAX_ATTEMPTS) return false;

  if (!safeEqualHex(otp.codeHash, hashCode(email, code))) {
    await db.emailOtp.update({
      where: { id: otp.id },
      data: {
        attempts: { increment: 1 },
        ...(otp.attempts + 1 >= OTP_MAX_ATTEMPTS ? { consumedAt: new Date() } : {}),
      },
    });
    return false;
  }

  // Atomic consume: guards against two parallel requests using the same code.
  const consumed = await db.emailOtp.updateMany({
    where: { id: otp.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  return consumed.count === 1;
}

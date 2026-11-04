import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOtp, OTP_RESEND_SECONDS, OTP_TTL_MINUTES } from "@/lib/otp";
import { emailConfigured, otpEmail, sendEmail } from "@/lib/email";
import { ipHash, normalizeEmail } from "@/lib/security";

const schema = z.object({ email: z.string().trim().email("Please enter a valid email address").max(254) });

// POST /api/auth/otp — sends a 6-digit sign-in code to any email address.
export async function POST(request: NextRequest) {
  let email: string;
  try {
    email = normalizeEmail(schema.parse(await request.json()).email);
  } catch {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const result = await createOtp(email, ipHash(request));
  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          result.reason === "TOO_SOON"
            ? `Please wait ${result.retryAfter}s before requesting a new code.`
            : "Too many codes requested. Please try again later.",
        retryAfter: result.retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(result.retryAfter) } }
    );
  }

  if (!emailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[otp] DEV code for ${email}: ${result.code}`);
      return NextResponse.json({ sent: true, resendIn: OTP_RESEND_SECONDS, dev: true });
    }
    return NextResponse.json({ error: "Email delivery is temporarily unavailable." }, { status: 503 });
  }

  const mail = otpEmail(result.code, OTP_TTL_MINUTES);
  const sent = await sendEmail({ to: email, ...mail });
  if (!sent.success) {
    return NextResponse.json({ error: "We couldn't send the code. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ sent: true, resendIn: OTP_RESEND_SECONDS });
}

-- State-ImmoCom — Google sign-in, agent onboarding, client chat
-- Run ONCE in Supabase → SQL Editor BEFORE deploying the new code.
-- Purely additive: the current production code keeps working after this runs.

-- 1. Agent onboarding fields (existing accounts stay ACTIVE)
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "agentStatus"        TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "whatsapp"           TEXT,
  ADD COLUMN IF NOT EXISTS "serviceAreas"       TEXT,
  ADD COLUMN IF NOT EXISTS "termsAcceptedAt"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "profileCompletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "agentReviewedAt"    TIMESTAMP(3);

-- Agents auto-created by the previous Google sign-in have no profile: send them to onboarding.
UPDATE "User"
   SET "agentStatus" = 'INCOMPLETE'
 WHERE "role" = 'AGENT' AND "password" IS NULL AND ("phone" IS NULL OR "license" IS NULL);

-- 2. Client ownership of conversations + guest anti-spam
ALTER TABLE "Conversation"
  ADD COLUMN IF NOT EXISTS "clientId"    TEXT,
  ADD COLUMN IF NOT EXISTS "guestIpHash" TEXT;

DO $$ BEGIN
  ALTER TABLE "Conversation"
    ADD CONSTRAINT "Conversation_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "Conversation_clientId_lastMessageAt_idx" ON "Conversation"("clientId", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "Conversation_agentId_lastMessageAt_idx"  ON "Conversation"("agentId", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "Conversation_guestIpHash_createdAt_idx"  ON "Conversation"("guestIpHash", "createdAt");

-- 3. One-time email codes (only a keyed hash of each code is stored)
CREATE TABLE IF NOT EXISTS "EmailOtp" (
  "id"         TEXT         NOT NULL,
  "email"      TEXT         NOT NULL,
  "codeHash"   TEXT         NOT NULL,
  "ipHash"     TEXT,
  "attempts"   INTEGER      NOT NULL DEFAULT 0,
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailOtp_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "EmailOtp_email_createdAt_idx"  ON "EmailOtp"("email", "createdAt");
CREATE INDEX IF NOT EXISTS "EmailOtp_ipHash_createdAt_idx" ON "EmailOtp"("ipHash", "createdAt");

-- 4. Supabase exposes public tables through its REST API: keep this one private.
--    (Prisma connects as the table owner, so RLS does not affect the app.)
ALTER TABLE "EmailOtp" ENABLE ROW LEVEL SECURITY;

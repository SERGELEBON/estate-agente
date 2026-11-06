-- State-ImmoCom — language schools & reviews. Additive, safe to run before deploying.
CREATE TABLE IF NOT EXISTS "School" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "tagline" TEXT,
  "description" TEXT NOT NULL,
  "teachesEnglish" BOOLEAN NOT NULL DEFAULT false,
  "teachesFrench" BOOLEAN NOT NULL DEFAULT false,
  "levels" TEXT NOT NULL DEFAULT '[]',
  "formats" TEXT NOT NULL DEFAULT '[]',
  "exams" TEXT NOT NULL DEFAULT '[]',
  "country" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "address" TEXT,
  "phone" TEXT,
  "whatsapp" TEXT,
  "email" TEXT,
  "website" TEXT,
  "logo" TEXT,
  "coverImage" TEXT,
  "accreditation" TEXT,
  "priceFrom" DOUBLE PRECISION,
  "currency" TEXT NOT NULL DEFAULT 'GHS',
  "priceUnit" TEXT NOT NULL DEFAULT 'MONTH',
  "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "reviewedAt" TIMESTAMP(3),
  "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ratingCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "School_ownerId_key" ON "School"("ownerId");
CREATE UNIQUE INDEX IF NOT EXISTS "School_slug_key" ON "School"("slug");
CREATE INDEX IF NOT EXISTS "School_status_country_city_idx" ON "School"("status", "country", "city");
CREATE INDEX IF NOT EXISTS "School_status_ratingAvg_idx" ON "School"("status", "ratingAvg");
DO $$ BEGIN
  ALTER TABLE "School" ADD CONSTRAINT "School_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "SchoolReview" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "title" TEXT,
  "comment" TEXT NOT NULL,
  "hidden" BOOLEAN NOT NULL DEFAULT false,
  "reply" TEXT,
  "repliedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SchoolReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SchoolReview_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);
CREATE UNIQUE INDEX IF NOT EXISTS "SchoolReview_schoolId_authorId_key" ON "SchoolReview"("schoolId", "authorId");
CREATE INDEX IF NOT EXISTS "SchoolReview_schoolId_hidden_createdAt_idx" ON "SchoolReview"("schoolId", "hidden", "createdAt");
DO $$ BEGIN
  ALTER TABLE "SchoolReview" ADD CONSTRAINT "SchoolReview_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "SchoolReview" ADD CONSTRAINT "SchoolReview_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Faster property filters by country / city (francophone listings)
CREATE INDEX IF NOT EXISTS "Property_status_country_city_idx" ON "Property"("status", "country", "city");

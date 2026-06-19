#!/bin/bash
export DATABASE_URL="postgresql://neondb_owner:npg_oDNxaPhK9p0J@ep-shiny-hall-at4eke96-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
npx prisma generate
npx prisma db push --accept-data-loss --skip-generate
npx tsx prisma/seed.ts
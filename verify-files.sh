#!/bin/bash
# verify-files.sh — Ensures all critical project files exist
# Run this after container restart to detect missing files
# If files are missing, restore them from the last git commit

cd /home/z/my-project

CRITICAL_FILES=(
  "src/app/api/upload/route.ts"
  "src/app/api/files/[...path]/route.ts"
  "src/app/api/properties/route.ts"
  "src/app/api/properties/[id]/route.ts"
  "src/app/api/contact/route.ts"
  "src/app/api/stats/route.ts"
  "src/app/api/users/route.ts"
  "src/app/api/messages/route.ts"
  "src/app/api/visits/route.ts"
  "src/components/property-form.tsx"
  "src/components/chatbot.tsx"
  "src/components/navbar.tsx"
  "src/lib/auth.ts"
  "src/lib/db.ts"
  "src/lib/email.ts"
  "next.config.ts"
  ".env"
  "prisma/schema.prisma"
)

MISSING=0
for f in "${CRITICAL_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "❌ MISSING: $f"
    MISSING=$((MISSING + 1))
  fi
done

if [ $MISSING -gt 0 ]; then
  echo ""
  echo "⚠️  $MISSING critical file(s) missing! Restoring from git..."
  git checkout HEAD -- src/ next.config.ts .env 2>/dev/null
  echo "✅ Files restored from last commit"
else
  echo "✅ All $(( ${#CRITICAL_FILES[@]} )) critical files present"
fi

# Verify key settings in next.config.ts
if ! grep -q "proxyClientMaxBodySize" next.config.ts; then
  echo "⚠️  WARNING: proxyClientMaxBodySize missing from next.config.ts"
fi
if ! grep -q "unoptimized" next.config.ts; then
  echo "⚠️  WARNING: unoptimized missing from next.config.ts"
fi

# Verify upload route returns /api/files/ URLs
if ! grep -q "/api/files/" src/app/api/upload/route.ts 2>/dev/null; then
  echo "⚠️  WARNING: Upload route not returning /api/files/ URLs"
fi

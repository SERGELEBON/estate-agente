# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

State-ImmoCom is a real estate management platform built with Next.js 14 (App Router), allowing agents to manage properties and visitors to discover them. The application supports two user roles: ADMIN (platform-wide access) and AGENT (personal properties only).

## Development Commands

```bash
# Development
npm run dev              # Start dev server on port 3000

# Database
npm run db:push          # Sync Prisma schema to PostgreSQL (production) or SQLite (local)
npm run db:generate      # Generate Prisma client (auto-runs on postinstall)
npm run db:migrate       # Create a new migration
npm run db:reset         # Reset database and re-run migrations
npm run seed             # Seed database with test data

# Production
npm run build            # Build for production (runs prisma generate first)
npm run start            # Start production server (standalone mode)

# Code Quality
npm run lint             # Run ESLint
```

**Important:** Use NPM only. Do not use Bun - it has compatibility issues with Next.js 15 that cause corrupted node_modules.

## Environment Variables

Required variables in `.env`:

```env
# Database (PostgreSQL in production, SQLite for local dev)
DATABASE_URL="postgresql://..."  # or "file:./db/custom.db" for local SQLite

# NextAuth (CRITICAL - affects all authentication)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"

# Cloudinary (for image/video uploads)
CLOUDINARY_CLOUD_NAME="db4anvtyj"
CLOUDINARY_API_KEY="644254485349351"
CLOUDINARY_API_SECRET="<secret>"

# Optional OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
```

## Authentication Architecture

**Provider:** NextAuth.js v4 with JWT strategy (no database sessions)

**Flow:**
1. User signs in via credentials or OAuth
2. JWT token created and stored in HTTP-only cookie
3. Session managed client-side via `SessionProvider` (src/lib/auth-context.tsx)
4. Protected routes use `useAuth()` hook or server-side `getServerSession()`

**Key Files:**
- `src/lib/auth.ts` - NextAuth configuration
- `src/lib/auth-context.tsx` - Client-side auth context with `useAuth()` hook
- `src/app/api/auth/[...nextauth]/route.ts` - Auth API endpoints (NextAuth catch-all)
- `src/app/dashboard/layout.tsx` - Protected layout with role-based redirects

**Critical Pattern - Avoiding React Hydration Errors:**

Dashboard layouts must wait for client-side mount before rendering to prevent SSR/client mismatches:

```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted || isLoading) {
  return <LoadingSpinner />;
}
```

Use `window.location.href` for redirects in layouts, NOT `router.push()` or `router.replace()` - Next.js router calls during render cause React error #310 (streaming/suspense conflicts).

## Database Schema (Prisma)

**Core Models:**
- `User` - Agents/admins with role-based permissions
- `Property` - Listings with images/videos stored as JSON arrays
- `Conversation` - Message threads between visitors and agents
- `Message` - Individual messages within conversations
- `Visit` - Scheduled property viewings

**Key Relationships:**
- Properties → User (agent): Each property belongs to one agent
- Conversations → User (agent): Each conversation assigned to agent
- Messages → Conversation: Messages grouped by conversation
- Visits → Property + User (agent)

**Important Fields:**
- `Property.images` / `Property.videos` - JSON-stringified arrays of Cloudinary URLs
- `User.role` - "ADMIN" or "AGENT" (controls dashboard access)
- `Conversation.visitorToken` - Unique token for visitors to access their conversation
- `Conversation.unreadForAgent` / `unreadForVisitor` - Unread message counts

## File Upload System (Cloudinary)

**Endpoint:** `POST /api/upload`

**Flow:**
1. Client uploads file via FormData
2. Server validates type/size (50MB max)
3. Buffer sent to Cloudinary via upload_stream
4. Returns secure_url for storage in database

**Supported Types:**
- Images: jpeg, jpg, png, webp, gif
- Videos: mp4, webm, quicktime

**Critical:** Cloudinary domain must be whitelisted in `next.config.mjs`:

```javascript
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "res.cloudinary.com",
    },
  ],
}
```

Without this, Next.js `<Image>` components will fail to load Cloudinary images.

## API Route Patterns

**Dynamic vs Static Rendering:**

Routes using `getServerSession()`, `request.url`, or dynamic headers must be marked:

```typescript
export const dynamic = 'force-dynamic';
```

This prevents Next.js from attempting static rendering, which causes "Dynamic Server Usage" errors in production.

**Authentication Pattern:**

```typescript
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const userId = (session.user as any).id;
const userRole = (session.user as any).role;

// Admin sees all, agents see only their own
const where = userRole === "ADMIN" ? {} : { agentId: userId };
```

## Role-Based Access Control

**Two Roles:**
- `ADMIN` - Access to `/dashboard/admin/*` (all users, properties, messages, visits)
- `AGENT` - Access to `/dashboard/agent/*` (only their own properties, messages, visits)

**Dashboard Routing:**
- Dashboard layout (`src/app/dashboard/layout.tsx`) enforces role-based redirects
- Admins accessing `/dashboard/agent/*` → redirected to `/dashboard/admin`
- Agents accessing `/dashboard/admin/*` → redirected to `/dashboard/agent`

**API Filtering:**
Endpoints like `/api/stats`, `/api/notifications` check `userRole` and filter queries:

```typescript
const where = userRole === "ADMIN" ? {} : { agentId: userId };
const properties = await db.property.findMany({ where });
```

## Messaging System

**Architecture:**
- Public visitors submit contact form → creates Conversation + initial Message
- Each conversation gets unique `visitorToken` (sent via email)
- Visitors access conversation via `/messages/[token]` (public, no auth)
- Agents access conversations via `/dashboard/agent/messages` (auth required)

**Unread Counts:**
- `Conversation.unreadForAgent` - Incremented when visitor sends message
- `Conversation.unreadForVisitor` - Incremented when agent replies
- Counts reset when respective party views the conversation

**Key Routes:**
- `POST /api/conversations` - Create new conversation (public)
- `GET /api/conversations/visitor?token=xxx` - Visitor view (public)
- `GET /api/conversations` - Agent/admin view (auth required)
- `POST /api/messages` - Send message (both visitor and agent)

## Common Development Patterns

**Fetching Data in Server Components:**

```typescript
import { db } from "@/lib/db";

export default async function PropertiesPage() {
  const properties = await db.property.findMany({
    include: { agent: true },
  });

  return <PropertyList properties={properties} />;
}
```

**Protected Client Components:**

```typescript
"use client";
import { useAuth } from "@/lib/auth-context";

export default function Dashboard() {
  const { user, role, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <LoginPrompt />;

  return <DashboardContent role={role} />;
}
```

**Prisma JSON Fields:**

Images/videos stored as stringified JSON arrays:

```typescript
// Writing
const images = JSON.stringify([url1, url2, url3]);
await db.property.create({ data: { images } });

// Reading
const property = await db.property.findUnique({ where: { id } });
const imageUrls = JSON.parse(property.images);
```

## Deployment (Vercel)

**Build Output:** Standalone mode enabled in `next.config.mjs`

**Environment Variables on Vercel:**
- Set all `.env` variables in Vercel dashboard
- `DATABASE_URL` should point to PostgreSQL (not SQLite)
- `NEXTAUTH_URL` must match deployment URL

**Build Command:** `npm run build` (auto-runs `prisma generate`)

**Start Command:** `npm run start` (runs standalone server)

**Common Production Issues:**

1. **Dynamic Server Usage Errors** - Add `export const dynamic = 'force-dynamic'` to route
2. **React Hydration #318/#310** - Use mounted state pattern in layouts
3. **Images Not Loading** - Verify domain in `next.config.mjs` remotePatterns
4. **Database Connection** - Ensure `DATABASE_URL` is PostgreSQL URL (not SQLite file path)

## Test Credentials

After running `npm run seed`:

```
Admin:
- Email: admin@state-immocom.com
- Password: Admin@2024

Agent:
- Email: agent@state-immocom.com
- Password: Agent@2024
```

(Note: Old seed script may use admin@gmail.com / 123456 - check prisma/seed.ts)

## Important Constraints

**Never use Bun commands** - Use npm only for all package management and scripts
**Always mark dynamic API routes** - Add `export const dynamic = 'force-dynamic'` when using getServerSession
**Prevent hydration errors** - Use mounted state pattern in dashboard layouts
**Whitelist image domains** - Add all external image hosts to next.config.mjs
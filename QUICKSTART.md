# 🚀 Quick Start Guide - State-ImmoCom

## Prerequisites

- Node.js 20+ installed
- Docker installed and running
- npm or yarn package manager

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
cd state-agente
npm install
```

### 2. Start PostgreSQL Database

```bash
# Start PostgreSQL with Docker Compose
docker compose up -d

# Verify database is running
docker compose ps
```

Expected output:
```
NAME                IMAGE                  STATUS
state-immocom-db    postgres:16-alpine     Up
```

### 3. Configure Environment

The `.env` file is already configured for local development:

```env
DATABASE_URL="postgresql://state_user:state_password_dev_2024@localhost:5433/state_immocom?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="YtEtwQ9f7d7zKy1cnumNS6Illlae9v8irZKNh1/zuyM="
```

### 4. Initialize Database

```bash
# Sync Prisma schema with database
npm run db:push

# Seed database with test data
npm run seed
```

### 5. Run Tests (Optional)

```bash
# Test authentication system
node scripts/test-auth.js
```

Expected output:
```
✅ All tests PASSED!
🚀 Authentication system is ready for production
```

### 6. Start Development Server

```bash
npm run dev
```

Server will start on: **http://localhost:3000**

---

## 🧪 Test Credentials

### Admin Account
- **Email:** `admin@state-immocom.com`
- **Password:** `Admin@2024`
- **Dashboard:** `/dashboard/admin`

### Agent Accounts

**Agent 1:**
- **Email:** `kwame@state-immocom.com`
- **Password:** `Agent@2024`
- **Dashboard:** `/dashboard/agent`

**Agent 2:**
- **Email:** `ama@state-immocom.com`
- **Password:** `Agent@2024`

**Agent 3:**
- **Email:** `kofi@state-immocom.com`
- **Password:** `Agent@2024`

---

## 🔗 Key URLs

| Page | URL | Description |
|------|-----|-------------|
| **Home** | http://localhost:3000 | Public landing page |
| **Sign In** | http://localhost:3000/auth/signin | Login page |
| **Register** | http://localhost:3000/auth/register | New user registration |
| **Admin Dashboard** | http://localhost:3000/dashboard/admin | Admin control panel |
| **Agent Dashboard** | http://localhost:3000/dashboard/agent | Agent workspace |

---

## 🎯 Quick Testing Workflow

### Test 1: Admin Login
1. Go to http://localhost:3000/auth/signin
2. Enter `admin@state-immocom.com` / `Admin@2024`
3. Click "Sign In"
4. ✅ Should redirect to `/dashboard/admin`

### Test 2: Agent Registration
1. Go to http://localhost:3000/auth/register
2. Fill form with:
   - Role: **Real Estate Agent**
   - Name: `Test Agent`
   - Email: `test@example.com`
   - Phone: `+233 20 000 0000`
   - Password: `Test@2024`
   - Company: `Test Realty`
   - License: `TL-2024-001`
3. Click "Register as Real Estate Agent"
4. ✅ Should auto-login and redirect to `/dashboard/agent`

### Test 3: Create Property (Agent)
1. Login as agent
2. Navigate to "Add Property"
3. Fill property details
4. Upload images
5. Click "Create Property"
6. ✅ Property should appear in "My Properties"

---

## 🛠️ Useful Commands

### Database Management

```bash
# Start database
docker compose up -d

# Stop database
docker compose down

# View database logs
docker compose logs -f postgres

# Access PostgreSQL shell
docker compose exec postgres psql -U state_user -d state_immocom

# Reset database (WARNING: Deletes all data)
npm run db:reset
npm run seed
```

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

### Database Queries

```bash
# View all users
docker compose exec postgres psql -U state_user -d state_immocom -c "SELECT email, role FROM \"User\";"

# Count properties
docker compose exec postgres psql -U state_user -d state_immocom -c "SELECT COUNT(*) FROM \"Property\";"

# View database schema
npx prisma studio
```

---

## 🐛 Troubleshooting

### Issue: Database connection failed

**Error:** `Can't reach database server`

**Solution:**
```bash
# Check if Docker container is running
docker compose ps

# Restart database
docker compose restart postgres

# Check logs
docker compose logs postgres
```

### Issue: Port 5433 already in use

**Solution:**
```bash
# Find process using port 5433
lsof -i :5433

# Stop existing container
docker compose down

# Restart
docker compose up -d
```

### Issue: Prisma client not generated

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
npx prisma generate
```

### Issue: Migration failed

**Solution:**
```bash
# Reset database
npm run db:reset

# Push schema
npm run db:push

# Seed data
npm run seed
```

---

## 📚 Additional Resources

- **Prisma Documentation:** https://www.prisma.io/docs
- **NextAuth.js Guide:** https://next-auth.js.org/getting-started/introduction
- **Next.js 14 Docs:** https://nextjs.org/docs
- **Docker Compose:** https://docs.docker.com/compose/

---

## 🚀 Next Steps

1. ✅ Test login and registration flows
2. ✅ Create test properties
3. ✅ Test messaging system
4. 📝 Configure OAuth providers (Google/Facebook)
5. 📧 Set up email verification
6. 🌐 Deploy to Vercel/Netlify

---

## 💡 Pro Tips

### Use Prisma Studio for Database Management

```bash
npx prisma studio
```

Opens a web interface at http://localhost:5555 to view and edit database records.

### Monitor Database Performance

```bash
# View active connections
docker compose exec postgres psql -U state_user -d state_immocom -c "SELECT count(*) FROM pg_stat_activity;"
```

### Backup Database

```bash
# Export database
docker compose exec postgres pg_dump -U state_user state_immocom > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U state_user state_immocom
```

---

**Need help?** Check `IMPROVEMENTS.md` for detailed technical documentation.

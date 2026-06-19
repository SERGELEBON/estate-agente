# 🚀 Guide de Déploiement Vercel

## 📋 Prérequis

### 1️⃣ **Créer une base de données PostgreSQL gratuite**

**Option A: Neon (Recommandé)**
1. Aller sur https://neon.tech
2. Créer un compte gratuit
3. Créer un nouveau projet
4. Copier la `DATABASE_URL` (format: `postgresql://...`)

**Option B: Vercel Postgres**
```bash
# Dans votre projet Vercel
vercel postgres create
```

**Option C: Supabase**
1. https://supabase.com
2. New project → Settings → Database → Connection string

---

## 🔧 Configuration Locale

### 1. Revenir à SQLite pour le développement local

```bash
# Modifier prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### 2. Fichier `.env` local
```bash
DATABASE_URL="file:./db/custom.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
```

### 3. Initialiser la BD
```bash
nvm use 20
npx prisma generate
npx prisma db push
```

---

## ☁️ Déploiement Vercel

### 1️⃣ **Installer Vercel CLI**
```bash
npm i -g vercel
```

### 2️⃣ **Lier le projet**
```bash
vercel link
```

### 3️⃣ **Configurer les variables d'environnement**

Dans le dashboard Vercel → Settings → Environment Variables:

```bash
# Base de données (Neon/Supabase/Vercel Postgres)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# NextAuth (IMPORTANT)
NEXTAUTH_URL=https://votre-app.vercel.app
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Contact
CONTACT_EMAIL=votre-email@gmail.com
WHATSAPP_NUMBER=votre-numero
```

### 4️⃣ **Modifier le schema pour production**

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}
```

### 5️⃣ **Déployer**
```bash
vercel --prod
```

### 6️⃣ **Initialiser la BD en production**
```bash
# Depuis votre machine locale avec DATABASE_URL de production
DATABASE_URL="postgresql://..." npx prisma db push
```

---

## 🖼️ **Gestion des Images**

### Problème
- Uploads locaux perdus sur Vercel
- Besoin de cloud storage

### Solution : Vercel Blob (Gratuit jusqu'à 1GB)

**1. Installer**
```bash
npm install @vercel/blob
```

**2. Configurer**
```ts
// lib/upload.ts
import { put } from '@vercel/blob';

export async function uploadImage(file: File) {
  const blob = await put(file.name, file, {
    access: 'public',
  });
  return blob.url;
}
```

**3. Variables d'environnement Vercel**
- Auto-configurées si Vercel Blob est activé

---

## 🔒 **Sécurité**

### Secrets à JAMAIS committer
```bash
# .gitignore (déjà présent)
.env
.env.local
.env.production
db/
```

### Générer un secret fort
```bash
openssl rand -base64 32
```

---

## 📊 **Migration SQLite → PostgreSQL**

### Export des données SQLite
```bash
# Installer sqlite3-to-postgres
npm install -g sqlite3-to-postgres

# Exporter
sqlite3-to-postgres \
  --source-file db/custom.db \
  --destination postgresql://user:pass@host/db
```

---

## ✅ **Checklist Pré-Déploiement**

- [ ] BD PostgreSQL créée (Neon/Vercel/Supabase)
- [ ] Variables d'environnement configurées dans Vercel
- [ ] `NEXTAUTH_SECRET` généré avec openssl
- [ ] Schema Prisma → `provider = "postgresql"`
- [ ] `npx prisma db push` exécuté avec DATABASE_URL production
- [ ] Tests locaux passent
- [ ] Images migrées vers Vercel Blob

---

## 🆘 **Dépannage**

### Erreur: "Cannot find module 'next/package.json'"
```bash
nvm use 20
rm -rf node_modules .next
npm install
```

### Erreur: Prisma Client not generated
```bash
npx prisma generate
```

### Images ne s'affichent pas
- Vérifier Vercel Blob activé
- Vérifier `BLOB_READ_WRITE_TOKEN` dans env vars

---

## 🎯 **Commandes utiles**

```bash
# Dev local
nvm use 20
npm run dev

# Build local
npm run build

# Déploiement preview
vercel

# Déploiement production
vercel --prod

# Logs production
vercel logs
```
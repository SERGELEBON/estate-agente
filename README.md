# State Agent - Plateforme Immobilière

Application de gestion immobilière moderne construite avec Next.js, permettant aux agents de gérer leurs propriétés et aux visiteurs de les découvrir.

## Stack Technique

- **Framework**: Next.js 15.1.6 (App Router)
- **Langage**: TypeScript
- **Base de données**: SQLite avec Prisma ORM
- **Authentification**: NextAuth.js (JWT)
- **UI**: TailwindCSS + Shadcn/ui
- **State Management**: Zustand
- **Validation**: Zod

## Prérequis

- Node.js 18+ ou Bun 1.2+
- SQLite3 (pour la base de données)

## Installation

```bash
# Cloner le projet
git clone <repository-url>
cd state-agente

# Installer les dépendances
bun install
# ou
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Modifier .env avec vos valeurs

# Générer le client Prisma
bunx prisma generate
# ou
npm run db:generate

# (Optionnel) Créer et peupler la base de données
bunx prisma db push
bunx tsx prisma/seed.ts
```

## Configuration

### Variables d'environnement requises

```env
DATABASE_URL="file:./db/custom.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<générer avec: openssl rand -base64 32>"
```

### Variables optionnelles (OAuth)

```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
```

## Démarrage

```bash
# Mode développement
bun run dev
# ou
npm run dev

# L'application sera disponible sur http://localhost:3000
```

## Comptes de test

Si vous avez exécuté le seed:

- **Admin**: admin@gmail.com / 123456
- **Agent**: agent@gmail.com / 123456

## Scripts disponibles

```bash
# Développement
bun run dev              # Démarrer le serveur dev

# Base de données
bun run db:push          # Synchroniser le schéma Prisma → SQLite
bun run db:generate      # Générer le client Prisma
bun run db:migrate       # Créer une migration
bun run seed             # Peupler la DB avec des données de test

# Production
bun run build            # Build optimisé (mode standalone)
bun run start            # Démarrer en production

# Qualité de code
bun run lint             # Vérifier avec ESLint
```

## Architecture

```
src/
├── app/                  # Next.js App Router
│   ├── api/             # API Routes
│   ├── dashboard/       # Dashboards (admin/agent)
│   ├── properties/      # Pages propriétés
│   └── auth/            # Pages authentification
├── components/          # Composants React
│   ├── ui/             # Composants Shadcn/ui
│   └── [custom]        # Composants métier
└── lib/                # Utilitaires
    ├── db.ts           # Client Prisma
    ├── auth.ts         # Config NextAuth
    └── utils.ts        # Helpers
```

## Fonctionnalités

- ✅ Authentification multi-providers (Email/OAuth)
- ✅ Dashboard Admin (gestion users, propriétés, messages, visites)
- ✅ Dashboard Agent (gestion propriétés personnelles)
- ✅ Système de messagerie visiteur-agent
- ✅ Upload d'images/vidéos (50MB max)
- ✅ Recherche et filtres de propriétés
- ✅ Gestion des visites
- ✅ Système de rôles (ADMIN/AGENT)
- ✅ Interface responsive

## Sécurité

- 🔒 Authentification JWT sécurisée
- 🔒 Hashage bcrypt des mots de passe
- 🔒 Middleware de protection des routes
- 🔒 Validation Zod des données
- 🔒 Variables d'environnement protégées

## Déploiement

Le projet utilise le mode `standalone` de Next.js pour un déploiement optimisé:

```bash
bun run build
# Les fichiers seront dans .next/standalone/

bun run start
# Lance le serveur en production
```

## Licence

Propriétaire - Tous droits réservés
# Data seeded successfully

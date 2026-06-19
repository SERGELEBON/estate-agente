# 🚀 Guide de Configuration - State Agent

## ⚠️ PROBLÈME IDENTIFIÉ

Le projet utilise **Bun** qui a des incompatibilités avec **Next.js 15** et crée des `node_modules` corrompus.

## ✅ SOLUTION: Utiliser NPM au lieu de Bun

### Étapes à suivre

```bash
# 1. Nettoyer complètement les dépendances
rm -rf node_modules .next bun.lock package-lock.json

# 2. Installer avec NPM (pas bun!)
npm install

# 3. Générer le client Prisma
npx prisma generate

# 4. Démarrer le serveur
npm run dev
```

## 📝 Configuration .env

Assurez-vous que votre `.env` contient:

```env
DATABASE_URL="file:./db/custom.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-change-in-production"
CONTACT_EMAIL="sergepoegnan@gmail.com"
WHATSAPP_NUMBER="2250103081065"
```

## ✅ Modifications Appliquées

### 1. **Next.js downgrade 16→15**
- Résout les erreurs de modules manquants
- Version stable avec npm

### 2. **Base de données configurée**
- Chemin relatif: `file:./db/custom.db`
- Base SQLite fonctionnelle (7 users, 21 properties)

### 3. **Bonnes pratiques appliquées**
- ✅ `.env.example` créé
- ✅ `.gitignore` amélioré (.env, .idea, logs)
- ✅ `README.md` complet
- ✅ Logs Prisma conditionnels (dev only)
- ✅ ESLint avec warnings au lieu de off
- ✅ TypeScript jsx: preserve

### 4. **Sécurité**
- ✅ NEXTAUTH_SECRET changé
- ✅ DATABASE_URL avec chemin relatif
- ✅ .env exclu du git

## 🎯 Commandes à exécuter maintenant

```bash
# Nettoyer
rm -rf node_modules .next bun.lock package-lock.json

# Installer (avec NPM, PAS BUN!)
npm install

# Générer Prisma
npx prisma generate

# Démarrer
npm run dev
```

## 🔍 Vérification

Une fois `npm run dev` lancé, vous devriez voir:

```
   ▲ Next.js 15.1.6
   - Local:        http://localhost:3000

 ✓ Starting...
 ✓ Ready in Xms
```

Puis accédez à:
- http://localhost:3000 (page d'accueil)
- http://localhost:3000/auth/signin (connexion)

## 📊 Comptes de test

```
Admin:
- Email: admin@gmail.com
- Password: 123456

Agent:
- Email: agent@gmail.com
- Password: 123456
```

## ⚠️ IMPORTANT

**N'utilisez JAMAIS `bun install` ou `bun run dev` avec Next.js 15!**

Utilisez uniquement:
- `npm install`
- `npm run dev`
- `npm run build`

## 🐛 Si ça ne fonctionne toujours pas

```bash
# Vérifier que node_modules est bien supprimé
ls node_modules 2>&1
# Doit afficher: "Aucun fichier ou dossier de ce nom"

# Vérifier la version de Node
node --version
# Doit être >= 18.0.0

# Réinstaller complètement
rm -rf node_modules .next package-lock.json bun.lock
npm cache clean --force
npm install
npx prisma generate
npm run dev
```

## 📚 Documentation

Voir `README.md` pour:
- Architecture complète
- Fonctionnalités
- Déploiement production
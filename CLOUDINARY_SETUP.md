# Configuration Cloudinary pour State-ImmoCom

## Pourquoi Cloudinary?

Vercel utilise un système de fichiers **en lecture seule** (serverless). On ne peut pas sauvegarder des fichiers uploadés dans `public/uploads/` comme en local.

**Cloudinary** est une solution de stockage cloud gratuite (25GB) parfaite pour les images et vidéos.

## Étapes de configuration

### 1. Créer un compte Cloudinary (gratuit)

1. Aller sur https://cloudinary.com/users/register_free
2. S'inscrire avec email
3. Activer le compte via email

### 2. Récupérer les credentials

Une fois connecté au dashboard Cloudinary:

1. Aller dans **Dashboard** (page d'accueil)
2. Copier les 3 valeurs suivantes:
   - **Cloud Name** (ex: `dxxxxx`)
   - **API Key** (ex: `123456789012345`)
   - **API Secret** (ex: `abcdefghijklmnopqrstuvwxyz`)

### 3. Configurer Vercel

#### Option A: Via le dashboard Vercel

1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet `state-agente`
3. Aller dans **Settings** → **Environment Variables**
4. Ajouter les 3 variables:
   ```
   CLOUDINARY_CLOUD_NAME = votre_cloud_name
   CLOUDINARY_API_KEY = votre_api_key
   CLOUDINARY_API_SECRET = votre_api_secret
   ```
5. Cliquer sur **Save**
6. **Redéployer** le projet (onglet Deployments → bouton Redeploy)

#### Option B: Via Vercel CLI

```bash
vercel env add CLOUDINARY_CLOUD_NAME
# Coller votre cloud_name

vercel env add CLOUDINARY_API_KEY
# Coller votre api_key

vercel env add CLOUDINARY_API_SECRET
# Coller votre api_secret
```

Puis redéployer:
```bash
vercel --prod
```

### 4. Configuration locale (développement)

Ajouter à votre fichier `.env`:

```env
CLOUDINARY_CLOUD_NAME="votre_cloud_name"
CLOUDINARY_API_KEY="votre_api_key"
CLOUDINARY_API_SECRET="votre_api_secret"
```

## Test de l'upload

Après configuration:

1. Se connecter à https://state-agente.vercel.app/auth/signin
2. Aller dans **Add Property**
3. Essayer d'uploader une image
4. L'image sera stockée sur Cloudinary dans le dossier `state-immocom/`

## Limites du plan gratuit

- **Stockage**: 25 GB
- **Bandwidth**: 25 GB/mois
- **Transformations**: 25 crédits/mois

Largement suffisant pour un projet moyen!

## Voir les fichiers uploadés

1. Aller sur https://console.cloudinary.com/
2. Se connecter
3. Aller dans **Media Library**
4. Dossier `state-immocom/` contient toutes les images/vidéos

## Troubleshooting

**Erreur: "Must supply api_key"**
→ Variables d'environnement pas configurées sur Vercel

**Erreur: "Invalid signature"**
→ CLOUDINARY_API_SECRET incorrect

**Upload fonctionne en local mais pas en production**
→ Vérifier que les variables sont bien ajoutées sur Vercel (Settings → Environment Variables)
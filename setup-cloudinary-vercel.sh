#!/bin/bash

echo "================================================"
echo "Configuration Cloudinary sur Vercel"
echo "================================================"
echo ""
echo "Tu vas ajouter les 3 variables d'environnement"
echo ""

# Cloud Name
echo "1/3 - CLOUDINARY_CLOUD_NAME"
echo "Entre ton Cloud Name (depuis dashboard Cloudinary):"
read -r CLOUD_NAME

vercel env add CLOUDINARY_CLOUD_NAME production <<EOF
$CLOUD_NAME
EOF

echo ""

# API Key
echo "2/3 - CLOUDINARY_API_KEY"
echo "Entre ton API Key:"
read -r API_KEY

vercel env add CLOUDINARY_API_KEY production <<EOF
$API_KEY
EOF

echo ""

# API Secret
echo "3/3 - CLOUDINARY_API_SECRET"
echo "Entre ton API Secret:"
read -r API_SECRET

vercel env add CLOUDINARY_API_SECRET production <<EOF
$API_SECRET
EOF

echo ""
echo "✅ Variables ajoutées!"
echo ""
echo "Redéploiement en cours..."
vercel --prod

echo ""
echo "================================================"
echo "✅ Configuration terminée!"
echo "================================================"
echo ""
echo "Attends 2 minutes, puis teste l'upload sur:"
echo "https://state-agente.vercel.app"

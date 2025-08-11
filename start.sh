#!/bin/bash
set -euo pipefail

echo "🚀 Starting PaieCashPlay Auth..."


: "${DB_HOST:?Missing DB_HOST}"
: "${DB_USER:?Missing DB_USER}"
: "${DB_PASSWORD:?Missing DB_PASSWORD}"
: "${DB_NAME:?Missing DB_NAME}"
: "${DB_PORT:?Missing DB_PORT}"

# Construire l'URL de base de données pour Cloud SQL
export DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-3306}/${DB_NAME}"


echo "🔍 Database URL configured"

# Générer le client Prisma avec la nouvelle URL
echo "⚙️ Generating Prisma client..."
npx prisma generate

# Attendre et configurer la base de données
echo "⏳ Setting up database..."
timeout=60
while ! npx prisma db push --accept-data-loss 2>/dev/null; do
  timeout=$((timeout - 1))
  if [ $timeout -eq 0 ]; then
    echo "❌ Database setup timeout"
    exit 1
  fi
  echo "Retrying database setup... ($timeout attempts left)"
  sleep 3
done

echo "✅ Database schema ready"

# Initialiser les données par défaut
echo "🌱 Initializing default data..."
node seed-production.js || echo "⚠️ Seed completed with warnings"

# Démarrer l'application
echo "🌐 Starting Next.js server on port $PORT..."
exec npm start
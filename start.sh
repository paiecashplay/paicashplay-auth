#!/bin/bash
set -e

echo "🚀 Starting PaieCashPlay Auth..."

# Wait for database connection
echo "⏳ Waiting for database..."
timeout=30
while ! npx prisma db push --accept-data-loss 2>/dev/null; do
  timeout=$((timeout - 1))
  if [ $timeout -eq 0 ]; then
    echo "❌ Database connection timeout"
    exit 1
  fi
  echo "Retrying database connection... ($timeout attempts left)"
  sleep 2
done

echo "✅ Database ready"

# Start the application
echo "🌐 Starting Next.js server on port $PORT..."
exec npm start
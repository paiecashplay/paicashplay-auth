#!/bin/bash

# Script de déploiement pour Cloud Run
set -e

# Variables
PROJECT_ID="your-project-id"
SERVICE_NAME="paiecashplay-auth"
REGION="us-central1"
CLOUD_SQL_INSTANCE="your-project-id:region:instance-name"

echo "🚀 Déploiement de PaieCashPlay Auth sur Cloud Run..."

# Build et push de l'image
echo "📦 Construction de l'image Docker..."
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME .
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME

# Déploiement sur Cloud Run
echo "🌐 Déploiement sur Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances $CLOUD_SQL_INSTANCE \
  --memory 1Gi \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars CLOUD_SQL_CONNECTION_NAME=$CLOUD_SQL_INSTANCE

echo "✅ Déploiement terminé !"
echo "🔗 URL du service : $(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')"
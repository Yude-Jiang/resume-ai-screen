#!/bin/bash
# Deploy to Google Cloud Run using Buildpacks (source deploy)
# Forces deploy by deleting service first
set -e

PROJECT_ID="st-china-ai-force"
REGION="asia-east1"
SERVICE_NAME="resume-ai-screen"

echo "=== Git commit being deployed ==="
git log -1 --oneline
echo ""

echo "=== Setting project ==="
gcloud config set project $PROJECT_ID

echo "=== Deploying to Cloud Run (Buildpacks) ==="
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "FIREBASE_PROJECT_ID=trendradar-485407" \
  --set-secrets "GEMINI_API_KEY=VITE_GEMINI_API_KEY:latest,DEEPSEEK_API_KEY=VITE_DEEPSEEK_API_KEY:latest"

echo ""
echo "=== Done ==="
gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"

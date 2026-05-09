#!/bin/bash
# Deploy to Google Cloud Run using Buildpacks (source deploy)
# Run in Google Cloud Shell from the project root
# Prerequisites: secrets in Secret Manager (VITE_GEMINI_API_KEY, VITE_DEEPSEEK_API_KEY)

set -e

PROJECT_ID="st-china-ai-force"
REGION="asia-east1"
SERVICE_NAME="resume-ai-screen"

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
  --set-secrets "GEMINI_API_KEY=VITE_GEMINI_API_KEY:latest,DEEPSEEK_API_KEY=VITE_DEEPSEEK_API_KEY:latest"

echo "=== Done ==="
gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"

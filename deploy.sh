#!/bin/bash
# Deploy to Google Cloud Run
# Run this in Google Cloud Shell after cloning the repo

set -e

PROJECT_ID="trendradar-485407"
REGION="us-central1"
SERVICE_NAME="resume-ai-screen"

echo "=== Setting project ==="
gcloud config set project $PROJECT_ID

echo "=== Building container ==="
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

echo "=== Deploying to Cloud Run ==="
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY},DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY:-}"

echo "=== Done ==="
gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"

#!/bin/bash
# Deploy to Google Cloud Run using Buildpacks (source deploy)
# Forces clean build by deleting service first
set -e

PROJECT_ID="st-china-ai-force"
REGION="asia-east1"
SERVICE_NAME="resume-ai-screen"

echo "=== Git commit being deployed ==="
git log -1 --oneline
echo ""

echo "=== Setting project ==="
gcloud config set project $PROJECT_ID

echo "=== Deleting old service to force clean build ==="
gcloud run services delete $SERVICE_NAME --region=$REGION --quiet 2>/dev/null || echo "(no existing service)"

echo "=== Fetching Firebase config from Secret Manager ==="
FIREBASE_JSON=$(gcloud secrets versions access latest --secret=FIREBASE_CONFIG --project=$PROJECT_ID 2>/dev/null || echo "")
if [ -n "$FIREBASE_JSON" ]; then
  VITE_FIREBASE_API_KEY=$(echo "$FIREBASE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['apiKey'])")
  VITE_FIREBASE_AUTH_DOMAIN=$(echo "$FIREBASE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['authDomain'])")
  VITE_FIREBASE_PROJECT_ID=$(echo "$FIREBASE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['projectId'])")
  VITE_FIREBASE_STORAGE_BUCKET=$(echo "$FIREBASE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['storageBucket'])")
  VITE_FIREBASE_SENDER_ID=$(echo "$FIREBASE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['messagingSenderId'])")
  VITE_FIREBASE_APP_ID=$(echo "$FIREBASE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['appId'])")
else
  echo "ERROR: FIREBASE_CONFIG secret not found. Create it first:"
  echo "  gcloud secrets create FIREBASE_CONFIG --data-file=firebase-applet-config.json"
  exit 1
fi

echo "=== Deploying to Cloud Run (Buildpacks - clean build) ==="
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-secrets "GEMINI_API_KEY=VITE_GEMINI_API_KEY:latest,DEEPSEEK_API_KEY=VITE_DEEPSEEK_API_KEY:latest" \
  --set-build-env-vars "VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY},VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN},VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID},VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET},VITE_FIREBASE_SENDER_ID=${VITE_FIREBASE_SENDER_ID},VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}"

echo ""
echo "=== Done ==="
gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"

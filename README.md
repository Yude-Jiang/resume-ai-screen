# AI Resume Screening

AI-powered resume screening system for STMicroelectronics.

## Architecture

```
Browser (React 19 + Vite)
  ├── src/pages/      Page components
  ├── src/components/ Reusable UI components
  ├── src/hooks/      Custom hooks (useScreening)
  ├── src/services/   API client (gemini.ts)
  └── src/lib/        Firebase client

Express Server (tsx server.ts)
  ├── /api/ai/analyze-jd      JD → weights + thresholds
  ├── /api/ai/analyze-resume  Resume → scores + highlights
  ├── /api/ai/generate        Chat / free-form AI
  └── /api/extract-text       PDF/DOCX/TXT → text

Firebase (trendradar-485407)
  ├── Firestore (default)     Jobs + AnalysisResults
  └── Storage                 (future: resume files)

AI: Gemini 2.0 Flash (primary) → DeepSeek Chat (fallback)
```

## Quick Start

```bash
npm install
cp .env.example .env          # Edit with your API keys
cp firebase-applet-config.example.json firebase-applet-config.json  # Edit with your Firebase config
npm run dev                    # http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `DEEPSEEK_API_KEY` | No | Fallback AI provider |
| `APP_URL` | No | Deployment URL |

## Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore** (default database)
3. Enable **Anonymous Authentication** (Firebase Console → Authentication → Sign-in method)
4. Copy your web app config to `firebase-applet-config.json` (see `.example` template)
5. Deploy security rules: `npx firebase deploy --only firestore:rules`

## Deploy

```bash
npm run build
# Deploy dist/ to Cloud Run, Firebase Hosting, or any static host
# Ensure server.ts runs as the backend (or use a separate API service)
```

## Features

- Paste or upload Job Description → AI auto-configures scoring weights and thresholds
- Batch upload resumes (PDF/DOCX/TXT) → AI scores and ranks candidates
- Detailed per-candidate breakdown: score chart, highlights, gaps, recommendation
- HR override: adjust scores with feedback tags
- Blind screening mode: hide PII fields
- Talent library: cross-job candidate search and filtering
- Dashboard: active positions overview with stats
- AI Chat widget: ask questions about specific candidates
- Bilingual: English / 简体中文

## Privacy

All resume data is stored exclusively in your Firebase project. No data is shared with third parties.
Handle candidate PII in compliance with GDPR/PIPL and your organization's data retention policies.

## License

MIT

# Dark Phoenix — Deployment Guide

## Live URLs
- **Frontend:** https://dark-phoenix-kappa.vercel.app
- **Modal Backend:** https://aryantalati--ai-podcast-clipper-aipodcastclipper-process-video.modal.run
- **Google Drive Clips:** https://drive.google.com/drive/folders/1rjkdsvp-UCHCeUI1PBdsRosy7ghHs71s?usp=drive_link

## Test Login
- **Email:** tk.lunartech@gmail.com
- **Password:** LunarTech2026

## Assigned Video
- **URL:** https://www.youtube.com/watch?v=YRvf00NooN8
- **S3 Key:** 029c730c-5302-409e-857d-4669a67d686f/original.mp4

## Tech Stack
- **Frontend:** Next.js 15, deployed on Vercel
- **Database:** Supabase (Postgres) with Prisma ORM
- **File Storage:** AWS S3 (bucket: dark-phoenix-aryan, region: us-east-1)
- **Job Queue:** Inngest
- **AI Backend:** Modal (GPU: L40S)
- **AI Models:** WhisperX (transcription), Gemini 2.5 Flash (moment selection)
- **Video Processing:** FFmpeg

## Environment Variables Required
- DATABASE_URL
- AUTH_SECRET
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- S3_BUCKET_NAME
- GEMINI_API_KEY
- INNGEST_EVENT_KEY
- INNGEST_SIGNING_KEY
- PROCESS_VIDEO_ENDPOINT
- PROCESS_VIDEO_ENDPOINT_AUTH
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_SMALL_CREDIT_PACK
- STRIPE_MEDIUM_CREDIT_PACK
- STRIPE_LARGE_CREDIT_PACK
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- BASE_URL

## How to Reproduce Deployment

### 1. Fork and clone the repository
```bash
git clone https://github.com/AryanTalati/DARK-PHOENIX.git
cd DARK-PHOENIX
```

### 2. Set up services
- Vercel (frontend hosting)
- Supabase (database)
- AWS S3 (file storage)
- Google AI Studio (Gemini API key)
- Inngest (job queue)
- Stripe (payments)
- Modal (AI backend)

### 3. Configure environment variables
Copy .env.example to .env and fill in all values.

### 4. Push database schema
```bash
cd ai-podcast-clipper-frontend
npm install --legacy-peer-deps
npm run db:push
```

### 5. Deploy Modal backend
```bash
cd ai-podcast-clipper-backend
pip install modal
modal setup
python setup_modal_secret.py
modal deploy main.py
```

### 6. Deploy frontend
Connect GitHub repo to Vercel, set root directory to `ai-podcast-clipper-frontend`, add all environment variables, deploy.

### 7. Sync Inngest
Visit https://your-app.vercel.app/api/inngest and sync with Inngest dashboard.

### 8. Process a video
```bash
cd ai-podcast-clipper-frontend
node process-youtube.mjs
```
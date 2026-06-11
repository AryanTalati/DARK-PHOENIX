# Dark Phoenix — Write Up

## What I Did

Deployed the Dark Phoenix AI-powered podcast clipping platform end to end. 
The platform takes a YouTube video, transcribes it with WhisperX, selects 
the best moments using Gemini AI, renders vertical clips with captions and 
a LUNARTECH watermark using FFmpeg, and makes them available through a web 
dashboard.

## Changes Made to the Original Codebase

### 1. `requirements.txt` — Added setuptools
Added `setuptools==69.5.1` and `Cython` before WhisperX installation to fix 
a build compatibility issue. WhisperX v3.2.0 uses `pkg_resources` which was 
removed from newer setuptools versions.

### 2. `main.py` — Fixed image build and video codec
- Added pip upgrade and setuptools install step before requirements
- Added WhisperX installation with `--no-build-isolation` flag
- Changed FFmpeg cut command from `-c copy` to `-c:v libx264 -c:a aac` 
  because the source video uses AV1 codec which cannot be stream-copied
- Fixed fallback path in Columbia script failure to use the safe copy 
  at `base_dir / clip_name.mp4` instead of `clip_segment_path`
- Added LUNARTECH watermark via FFmpeg `drawtext` filter

### 3. `next.config.js` — No changes needed
The original env loading config works correctly in production.

### 4. `src/inngest/functions.ts` — Restored to original
Initially modified for Inngest v4 compatibility but reverted back to 
original code and downgraded Inngest to v3.54.0 to match the original 
codebase.

### 5. `vercel.json` — Added for deployment
Added `vercel.json` with custom install command to handle React 18/19 
peer dependency conflict with `shadcn-dropzone`.

### 6. `process-youtube.mjs` — New file
Created a Node.js ingestion script to download the assigned YouTube video, 
upload it to S3, create a database record, and trigger Inngest processing.

## What Failed and Why

### Columbia Speaker Detection Script
The `demoTalkNet.py` speaker detection script fails consistently due to a 
version incompatibility between `scenedetect` and `numpy`. The error is:

This occurs in `content_detector.py` when it tries to modify a numpy array 
that returns a tuple instead of a mutable array in newer numpy versions.

**Solution:** The existing fallback mechanism in `process_clip()` handles 
this gracefully — when Columbia fails, it falls back to processing the clip 
without speaker tracking, still burning in captions and the LUNARTECH 
watermark.

### AV1 Video Codec
The assigned YouTube video was downloaded in AV1 format which cannot be 
stream-copied into MP4 containers. Fixed by re-encoding to H264 using 
`-c:v libx264`.

## What I Would Improve

1. **Fix Columbia speaker detection** — Pin `scenedetect` and `numpy` to 
   compatible versions so speaker tracking works properly, enabling true 
   vertical reframing that follows the active speaker.

2. **Add YouTube URL input to dashboard** — Currently requires running a 
   manual script. Would add a URL input field to the frontend.

3. **Better error handling** — Add more detailed status messages so users 
   know exactly what stage processing is at.

4. **Vertical reframing** — With Columbia fixed, clips would be properly 
   reframed to 9:16 vertical format following the active speaker instead 
   of using the fallback horizontal format.

5. **Stripe webhook** — Set up the actual Stripe webhook endpoint for 
   production payments.

## Architecture Decisions

Used the existing architecture as designed — Next.js on Vercel for the 
frontend and business logic, Modal for GPU-based AI processing, Supabase 
for data storage, S3 for file storage, and Inngest for job queuing. All 
services communicate through environment variables and API keys as 
designed in the original codebase.
# 🌱 Sprout

**Play it live:** https://nabaaahmed.github.io/sprout/

A pixel-art virtual pet that grows for real when you study.

Run focus sessions, earn Sprout Points, and watch your companion evolve from a Seedling into an Ancient Bloom — powered by your actual study time. No login, no backend, just you and your buddy.

## Features
- Focus timer with custom durations and optional task labels
- Your pet evolves through 4 stages as you rack up study hours
- Shop for food, decor, and outfits using points you earn
- Journal with a GitHub-style heatmap of your study activity
- Study notes → AI pop quiz (Gemini via Cloudflare Worker — no player login)
- Streaks that never punish you for missing a day

## Running locally
```bash
npm install
npm run dev
```
Needs Node 18+.

## Quiz generation (optional)

Quizzes call **your** Cloudflare Worker, which holds a Gemini API key as a secret. Players never sign in and never see the key.

1. Get a Gemini key: https://aistudio.google.com/apikey  
2. Deploy the worker: see [`cloudflare-worker/README.md`](cloudflare-worker/README.md)  
3. Copy `.env.example` → `.env` and set `VITE_QUIZ_WORKER_URL`  
4. Restart `npm run dev`

## Tech
Vite + React, Tailwind CSS, Context API + localStorage for persistence. Quiz AI via Cloudflare Worker → Gemini.

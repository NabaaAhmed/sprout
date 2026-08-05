# Sprout Quiz Worker (Gemini proxy)

Tiny Cloudflare Worker between the Sprout frontend and Google Gemini. The API key stays here as a secret — never in the frontend.

No user sign-in in the app. You deploy once; players just hit **Generate Quiz**.

## Deploy

```bash
cd cloudflare-worker
npx wrangler login
npx wrangler secret put GEMINI_API_KEY   # paste key from https://aistudio.google.com/apikey
npx wrangler deploy
```

Copy the printed `*.workers.dev` URL into the app root `.env`:

```
VITE_QUIZ_WORKER_URL=https://sprout-quiz-worker.sprout-nabaa.workers.dev
```

(Your account’s workers.dev subdomain is `sprout-nabaa`.)

Restart `npm run dev` (or redeploy GitHub Pages) so Vite picks up the env var.

## Dashboard alternative

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages → Create Worker  
2. Paste `worker.js` → Save & Deploy  
3. Settings → Variables → add encrypted `GEMINI_API_KEY`  
4. Copy the worker URL into `.env` as above  

## Gemini key

Get a free key at [Google AI Studio](https://aistudio.google.com/apikey). If age verification blocks you on one Google account, try another or wait — Puter was the workaround we removed because it forced player sign-in.

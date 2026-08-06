# Quiz backend setup

little cloudflare worker for sprout's quiz feature. keeps the model api key on the server — never in the frontend.

players don't sign in; they just hit **Generate Quiz**. you deploy this once and point the app at the url.

## Deploy

```bash
cd cloudflare-worker
npx wrangler login
npx wrangler secret put GEMINI_API_KEY   # paste key from https://aistudio.google.com/apikey
npx wrangler deploy
```

copy the printed `*.workers.dev` url into the app root `.env`:

```
VITE_QUIZ_WORKER_URL=https://sprout-quiz-worker.sprout-nabaa.workers.dev
```

(my account's workers.dev subdomain is `sprout-nabaa`.)

restart `npm run dev` (or redeploy github pages) so the app picks up the env var.

## Dashboard alternative

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages → Create Worker  
2. Paste `worker.js` → Save & Deploy  
3. Settings → Variables → add encrypted `GEMINI_API_KEY`  
4. Copy the worker URL into `.env` as above  

## API key

get a free key at [Google AI Studio](https://aistudio.google.com/apikey).

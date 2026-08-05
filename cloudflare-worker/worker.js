/**
 * Sprout quiz proxy — Cloudflare Worker.
 *
 * Receives study notes from the frontend, calls Gemini with a server-side
 * API key (never exposed to the browser), returns a strict JSON quiz.
 *
 * Secret (set via `npx wrangler secret put GEMINI_API_KEY`):
 *   GEMINI_API_KEY
 */

const MODEL = 'gemini-flash-latest'
const MAX_NOTES_CHARS = 8000
const ALLOWED_ORIGINS = [
  'https://nabaaahmed.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

const SYSTEM_PROMPT = `You generate short pop quizzes from a student's study notes.

Return ONLY valid JSON (no markdown fences, no commentary) matching this schema:
[
  {
    "type": "multiple_choice" | "short_answer",
    "question": string,
    "options": string[]  // required for multiple_choice (2–4 choices), omit or [] for short_answer
    "answer": string     // for multiple_choice, must exactly match one of options
  }
]

Rules:
- Produce 3 to 5 questions.
- Base every question ONLY on the notes provided. Do not invent unrelated facts.
- Prefer a mix of multiple_choice and short_answer when the notes support both.
- Keep questions clear and concise.`

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(origin),
    },
  })
}

function isValidQuiz(quiz) {
  if (!Array.isArray(quiz) || quiz.length < 3 || quiz.length > 5) return false
  return quiz.every((q) => {
    if (!q || typeof q !== 'object') return false
    if (typeof q.question !== 'string' || !q.question.trim()) return false
    if (typeof q.answer !== 'string' || !q.answer.trim()) return false
    if (q.type !== 'multiple_choice' && q.type !== 'short_answer') return false
    if (q.type === 'multiple_choice') {
      if (!Array.isArray(q.options) || q.options.length < 2) return false
      if (!q.options.map(String).includes(String(q.answer))) return false
    }
    return true
  })
}

function extractJson(text) {
  const trimmed = String(text ?? '').trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenced) {
      try {
        return JSON.parse(fenced[1].trim())
      } catch {
        /* fall through */
      }
    }
    const start = trimmed.indexOf('[')
    const end = trimmed.lastIndexOf(']')
    if (start === -1 || end <= start) return null
    try {
      return JSON.parse(trimmed.slice(start, end + 1))
    } catch {
      return null
    }
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, origin)
    }

    if (!env.GEMINI_API_KEY) {
      return jsonResponse({ error: 'Server misconfigured: missing GEMINI_API_KEY' }, 500, origin)
    }

    let payload
    try {
      payload = await request.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400, origin)
    }

    const notes = typeof payload?.notes === 'string' ? payload.notes.trim() : ''
    if (!notes) {
      return jsonResponse({ error: 'Notes are required' }, 400, origin)
    }
    if (notes.length > MAX_NOTES_CHARS) {
      return jsonResponse({ error: `Notes must be under ${MAX_NOTES_CHARS} characters` }, 400, origin)
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

    let geminiRes
    try {
      geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${SYSTEM_PROMPT}\n\nSTUDY NOTES:\n${notes}` }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: 'application/json',
          },
        }),
      })
    } catch {
      return jsonResponse({ error: 'Failed to reach Gemini' }, 502, origin)
    }

    if (!geminiRes.ok) {
      let detail = ''
      try {
        const errBody = await geminiRes.json()
        detail = errBody?.error?.message || ''
      } catch {
        /* ignore parse errors */
      }
      const status = geminiRes.status === 429 ? 429 : 502
      const message =
        geminiRes.status === 429
          ? 'Gemini rate limit hit — wait a minute and try again.'
          : `Gemini error (${geminiRes.status})${detail ? `: ${detail}` : ''}`
      return jsonResponse({ error: message }, status, origin)
    }

    let geminiJson
    try {
      geminiJson = await geminiRes.json()
    } catch {
      return jsonResponse({ error: 'Invalid Gemini response' }, 502, origin)
    }

    const text = geminiJson?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? ''
    const quiz = extractJson(text)

    if (!isValidQuiz(quiz)) {
      return jsonResponse({ error: 'Quiz failed schema validation' }, 502, origin)
    }

    return jsonResponse({ quiz }, 200, origin)
  },
}

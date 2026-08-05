const REQUEST_TIMEOUT_MS = 45000

/**
 * Cloudflare Worker URL from Vite env (never put the Gemini key in the frontend).
 * See .env.example and cloudflare-worker/README.md.
 */
export function getQuizWorkerUrl() {
  return (import.meta.env.VITE_QUIZ_WORKER_URL ?? '').trim()
}

/**
 * Validates quiz shape used by StudyNotes:
 * [{ type, question, options?, answer }, ...]
 */
function isValidQuiz(quiz) {
  if (!Array.isArray(quiz) || quiz.length === 0) return false
  return quiz.every((q) => {
    if (!q || typeof q !== 'object') return false
    if (typeof q.question !== 'string' || !q.question.trim()) return false
    if (typeof q.answer !== 'string' || !q.answer.trim()) return false
    if (q.type !== 'multiple_choice' && q.type !== 'short_answer') return false
    if (q.type === 'multiple_choice' && (!Array.isArray(q.options) || q.options.length === 0)) return false
    return true
  })
}

/**
 * Calls the Cloudflare Worker (Gemini proxy) to turn study notes into a quiz.
 * Always resolves — never throws — so the UI can show a friendly message.
 *
 * @param {string} notesText
 * @returns {Promise<{ ok: true, quiz: Array } | { ok: false, error: string }>}
 */
export async function generateQuiz(notesText) {
  const workerUrl = getQuizWorkerUrl()
  if (!workerUrl) {
    return { ok: false, error: 'not-configured' }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notesText }),
      signal: controller.signal,
    })

    if (!response.ok) {
      return { ok: false, error: `request-failed-${response.status}` }
    }

    let payload
    try {
      payload = await response.json()
    } catch {
      return { ok: false, error: 'invalid-json' }
    }

    if (!isValidQuiz(payload?.quiz)) {
      return { ok: false, error: 'invalid-shape' }
    }

    return { ok: true, quiz: payload.quiz }
  } catch (err) {
    if (err?.name === 'AbortError') {
      return { ok: false, error: 'timeout' }
    }
    return { ok: false, error: 'network' }
  } finally {
    clearTimeout(timeoutId)
  }
}

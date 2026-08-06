const REQUEST_TIMEOUT_MS = 45000

// grabs the quiz endpoint url from vite env — don't put api keys in the frontend!!
// setup notes are in .env.example + cloudflare-worker/README.md
export function getQuizWorkerUrl() {
  return (import.meta.env.VITE_QUIZ_WORKER_URL ?? '').trim()
}

// quick sanity check so we don't hand Quiz.jsx garbage
// shape: [{ type, question, options?, answer }, ...]
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

// hits the quiz endpoint with study notes.
// always returns { ok, ... } instead of throwing — ui just shows a friendly msg
export async function generateQuiz(notesText) {
  const workerUrl = getQuizWorkerUrl()
  if (!workerUrl) {
    return { ok: false, error: 'not-configured' }
  }

  const trimmed = String(notesText ?? '').trim()
  if (!trimmed) {
    return { ok: false, error: 'empty-notes' }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: trimmed }),
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

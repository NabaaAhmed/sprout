import { useMemo, useState } from 'react'
import { useGame } from '../context/GameContext'
import { PixelIcon } from './icons/PixelIcon'
import { Toast } from './Toast'
import { generateQuiz, getQuizWorkerUrl } from '../utils/quizApi'

const MAX_NOTE_LENGTH = 8000
const SP_PER_CORRECT = 5
const FRIENDLY_ERROR = "Couldn't generate a quiz right now — try again in a moment."

function errorMessageFor(code) {
  if (code === 'empty-notes') return 'Paste some study notes first, then generate a quiz.'
  if (code === 'not-configured') {
    return 'Quiz worker not configured yet — set VITE_QUIZ_WORKER_URL in your .env.'
  }
  if (code === 'timeout') return 'That took too long — try again with a shorter note.'
  if (typeof code === 'string' && code.startsWith('request-failed-429')) {
    return 'Gemini is rate-limiting right now — wait a minute and try again.'
  }
  return FRIENDLY_ERROR
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeAnswer(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function isAnswerCorrect(question, given) {
  if (question.type === 'multiple_choice') {
    return normalizeAnswer(given) === normalizeAnswer(question.answer)
  }
  return normalizeAnswer(given) === normalizeAnswer(question.answer)
}

function encouragement(correct, total) {
  if (total <= 0) return 'Nice try — every attempt helps it stick.'
  const ratio = correct / total
  if (ratio === 1) return 'Perfect bloom! You really know this material.'
  if (ratio >= 0.8) return 'Great work — almost a full garden.'
  if (ratio >= 0.5) return 'Solid progress. A little more watering and you’ll get there.'
  return 'Every miss is a seed. Review the answers and grow from here.'
}

export function Quiz() {
  const { state, setQuizNotesDraft, awardSproutPoints, saveQuizAttempt } = useGame()
  const notes = state.quizNotesDraft ?? ''
  const workerConfigured = Boolean(getQuizWorkerUrl())
  const [phase, setPhase] = useState('compose') // compose | taking | results
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [activeQuiz, setActiveQuiz] = useState(null) // { notesText, questions }
  const [answers, setAnswers] = useState({}) // index -> string (option text or typed)
  const [result, setResult] = useState(null)

  const attemptsNewestFirst = useMemo(
    () => [...(state.quizAttempts ?? [])].reverse().slice(0, 20),
    [state.quizAttempts]
  )

  const allAnswered =
    activeQuiz &&
    activeQuiz.questions.every((_, i) => {
      const a = answers[i]
      return a !== undefined && String(a).trim() !== ''
    })

  const startWithQuiz = (quiz, notesText) => {
    setActiveQuiz({ notesText, questions: quiz })
    setAnswers({})
    setResult(null)
    setError(null)
    setPhase('taking')
  }

  const handleGenerate = async (notesOverride) => {
    const trimmed = (notesOverride ?? notes).trim()
    if (!trimmed) {
      setError(errorMessageFor('empty-notes'))
      return
    }
    if (isGenerating) return

    setIsGenerating(true)
    setError(null)

    const gen = await generateQuiz(trimmed)
    setIsGenerating(false)

    if (!gen.ok) {
      setError(errorMessageFor(gen.error))
      return
    }

    startWithQuiz(gen.quiz, trimmed)
  }

  const handleSubmit = () => {
    if (!activeQuiz || !allAnswered) {
      setError('Answer every question before submitting.')
      return
    }

    const details = activeQuiz.questions.map((q, i) => {
      const given = answers[i]
      const correct = isAnswerCorrect(q, given)
      return { question: q, given, correct }
    })
    const correctCount = details.filter((d) => d.correct).length
    const total = details.length
    const spEarned = correctCount * SP_PER_CORRECT

    if (spEarned > 0) {
      awardSproutPoints(spEarned)
      setToast(`+${spEarned} SP for ${correctCount} correct!`)
    } else {
      setToast('No SP this round — keep practicing!')
    }

    const attempt = {
      id: makeId('quiz'),
      createdAt: new Date().toISOString(),
      notesText: activeQuiz.notesText,
      questions: activeQuiz.questions,
      answers: { ...answers },
      correctCount,
      total,
      spEarned,
    }
    saveQuizAttempt(attempt)

    setResult({ details, correctCount, total, spEarned })
    setPhase('results')
    setError(null)
  }

  const handleGenerateMore = () => {
    if (!activeQuiz?.notesText) return
    handleGenerate(activeQuiz.notesText)
  }

  const backToCompose = () => {
    setPhase('compose')
    setActiveQuiz(null)
    setAnswers({})
    setResult(null)
    setError(null)
  }

  return (
    <div className="flex flex-col items-center gap-5 px-4 pt-3 pb-32">
      <h2 className="pixel-text text-xl text-sprout-moss">Quiz</h2>

      {phase === 'compose' && (
        <div className="panel-paper w-full max-w-md p-5 space-y-4">
          <div className="flex items-center gap-2">
            <PixelIcon name="book" size={15} />
            <p className="text-xs font-bold text-sprout-charcoal/50">Study notes → pop quiz</p>
          </div>

          {!workerConfigured && (
            <p className="text-[11px] font-semibold text-sprout-brown bg-sprout-goldSoft/40 border border-sprout-gold/40 rounded-xl px-3 py-2 leading-relaxed">
              Quiz worker not configured yet — set <code className="font-mono">VITE_QUIZ_WORKER_URL</code> in your{' '}
              <code className="font-mono">.env</code> (see cloudflare-worker/README.md).
            </p>
          )}

          <textarea
            value={notes}
            onChange={(e) => setQuizNotesDraft(e.target.value.slice(0, MAX_NOTE_LENGTH))}
            placeholder="Paste what you studied — lecture notes, textbook bits, flashcards…"
            rows={6}
            className="font-body w-full resize-none rounded-2xl border-2 border-sprout-charcoal/15 bg-white px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-sprout-moss/50 transition-colors duration-300"
          />

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-sprout-charcoal/35">
              {notes.length}/{MAX_NOTE_LENGTH}
            </span>
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={!notes.trim() || isGenerating}
              className="btn-pixel pressable px-4 py-2 text-xs font-bold bg-sprout-sage disabled:bg-sprout-charcoal/10"
            >
              {isGenerating ? 'Generating…' : 'Generate Quiz'}
            </button>
          </div>

          {error && (
            <p className="text-xs font-semibold text-sprout-charcoal/70 bg-sprout-blushSoft/35 rounded-xl px-3 py-2 animate-fadeIn">
              {error}
            </p>
          )}

          <p className="text-[11px] text-sprout-charcoal/40 leading-relaxed">
            No sign-in needed — quizzes run through your Cloudflare Worker → Gemini.
            Earn {SP_PER_CORRECT} SP per correct answer.
          </p>
        </div>
      )}

      {phase === 'taking' && activeQuiz && (
        <div className="panel-paper w-full max-w-md p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-sprout-charcoal/50">
              {activeQuiz.questions.length} questions
            </p>
            <button
              type="button"
              onClick={backToCompose}
              className="text-[11px] font-bold text-sprout-moss underline"
            >
              Back to notes
            </button>
          </div>

          <div className="space-y-4">
            {activeQuiz.questions.map((q, i) => (
              <QuestionPrompt
                key={i}
                index={i}
                question={q}
                value={answers[i]}
                onChange={(val) => setAnswers((prev) => ({ ...prev, [i]: val }))}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs font-semibold text-sprout-charcoal/70 bg-sprout-blushSoft/35 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="btn-pixel pressable w-full py-2.5 text-xs font-bold bg-sprout-moss text-white disabled:bg-sprout-charcoal/15 disabled:text-sprout-charcoal/40"
          >
            Submit answers
          </button>
        </div>
      )}

      {phase === 'results' && result && (
        <div className="panel-paper w-full max-w-md p-5 space-y-4 animate-fadeIn">
          <div className="text-center space-y-1">
            <p className="display-text text-2xl text-sprout-charcoal">
              {result.correctCount}/{result.total} correct
            </p>
            <p className="text-sm font-bold text-sprout-moss">
              {result.spEarned > 0 ? `+${result.spEarned} SP earned` : 'Keep growing — SP next time'}
            </p>
            <p className="text-sm text-sprout-charcoal/65 leading-relaxed px-2">
              {encouragement(result.correctCount, result.total)}
            </p>
          </div>

          <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {result.details.map((d, i) => (
              <li
                key={i}
                className={`rounded-xl border px-3 py-2.5 text-xs ${
                  d.correct
                    ? 'bg-sprout-sage/25 border-sprout-moss/30'
                    : 'bg-sprout-blushSoft/30 border-sprout-blush/35'
                }`}
              >
                <p className="font-bold text-sprout-charcoal/85 leading-snug">
                  {i + 1}. {d.question.question}
                </p>
                <p className="mt-1 text-sprout-charcoal/55">
                  Your answer:{' '}
                  <span className="font-semibold text-sprout-charcoal/75">{d.given || '—'}</span>
                </p>
                {!d.correct && (
                  <p className="mt-0.5 text-sprout-moss font-semibold">
                    Correct: {d.question.answer}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleGenerateMore}
              disabled={isGenerating}
              className="btn-pixel pressable w-full py-2.5 text-xs font-bold bg-sprout-sage disabled:opacity-50"
            >
              {isGenerating ? 'Generating…' : 'Generate more like this'}
            </button>
            <button
              type="button"
              onClick={backToCompose}
              className="w-full py-2 text-xs font-bold text-sprout-moss underline"
            >
              Edit notes / new topic
            </button>
          </div>

          {error && (
            <p className="text-xs font-semibold text-sprout-charcoal/70 bg-sprout-blushSoft/35 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </div>
      )}

      {phase === 'compose' && attemptsNewestFirst.length > 0 && (
        <div className="panel-paper w-full max-w-md p-5">
          <p className="text-xs font-bold text-sprout-charcoal/50 mb-3">Past quizzes</p>
          <ul className="space-y-2.5 max-h-64 overflow-y-auto">
            {attemptsNewestFirst.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 text-sm border-b border-sprout-charcoal/10 pb-2"
              >
                <div className="min-w-0">
                  <p className="font-bold truncate">
                    {a.correctCount}/{a.total} · +{a.spEarned} SP
                  </p>
                  <p className="text-[11px] text-sprout-charcoal/45 truncate">
                    {new Date(a.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {a.notesText ? ` · ${a.notesText.slice(0, 40)}${a.notesText.length > 40 ? '…' : ''}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (a.notesText) setQuizNotesDraft(a.notesText)
                  }}
                  className="shrink-0 text-[11px] font-bold text-sprout-moss underline"
                >
                  Reuse notes
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

function QuestionPrompt({ index, question, value, onChange }) {
  const hasOptions =
    question.type === 'multiple_choice' && Array.isArray(question.options) && question.options.length > 0

  return (
    <div className="rounded-xl bg-sprout-cream/70 border border-sprout-charcoal/10 p-3">
      <p className="text-xs font-bold text-sprout-charcoal/80 leading-snug">
        {index + 1}. {question.question}
      </p>

      {hasOptions ? (
        <div className="mt-2 space-y-1.5">
          {question.options.map((opt, oi) => {
            const selected = value === opt
            return (
              <button
                key={oi}
                type="button"
                onClick={() => onChange(opt)}
                className={`w-full text-left text-[11px] rounded-lg px-2.5 py-1.5 border transition-colors duration-300 ${
                  selected
                    ? 'bg-sprout-sage/40 border-sprout-moss/45 font-bold'
                    : 'bg-white border-sprout-charcoal/10 hover:bg-sprout-sage/10'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      ) : (
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer…"
          className="mt-2 w-full rounded-lg border border-sprout-charcoal/15 bg-white px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-sprout-moss/50"
        />
      )}
    </div>
  )
}

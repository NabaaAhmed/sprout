import { useMemo, useState } from 'react'
import { useGame } from '../context/GameContext'
import { PixelIcon } from './icons/PixelIcon'
import { generateQuiz, getQuizWorkerUrl } from '../utils/quizApi'

const MAX_NOTE_LENGTH = 8000
const FRIENDLY_ERROR = "Couldn't generate a quiz right now — try again in a moment."

function makeId() {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function errorMessageFor(code) {
  if (code === 'not-configured') {
    return 'Quiz worker not configured yet — set VITE_QUIZ_WORKER_URL in your .env (see cloudflare-worker/README.md).'
  }
  return FRIENDLY_ERROR
}

export function StudyNotes() {
  const { state, addStudyNote, deleteStudyNote } = useGame()
  const [text, setText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastError, setLastError] = useState(null)

  const notes = state.notes ?? []
  const notesNewestFirst = useMemo(() => [...notes].reverse(), [notes])
  const workerConfigured = Boolean(getQuizWorkerUrl())

  const handleGenerate = async () => {
    const trimmed = text.trim()
    if (!trimmed || isGenerating) return

    setIsGenerating(true)
    setLastError(null)

    const result = await generateQuiz(trimmed)

    addStudyNote({
      id: makeId(),
      createdAt: new Date().toISOString(),
      text: trimmed,
      quiz: result.ok ? result.quiz : null,
      status: result.ok ? 'success' : 'error',
    })

    if (!result.ok) {
      setLastError(errorMessageFor(result.error))
    } else {
      setText('')
    }
    setIsGenerating(false)
  }

  return (
    <div className="panel-paper w-full max-w-md p-5 space-y-4">
      <div className="flex items-center gap-2">
        <PixelIcon name="pencil" size={15} />
        <p className="text-xs font-bold text-sprout-charcoal/50">Study notes &amp; quizzes</p>
      </div>

      {!workerConfigured && (
        <p className="text-[11px] font-semibold text-sprout-brown bg-sprout-goldSoft/40 border border-sprout-gold/40 rounded-xl px-3 py-2 leading-relaxed">
          Quiz worker not configured yet — set <code className="font-mono">VITE_QUIZ_WORKER_URL</code> in your{' '}
          <code className="font-mono">.env</code> after deploying the Cloudflare Worker. Notes will still be saved.
        </p>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_NOTE_LENGTH))}
        placeholder="Paste or type what you studied today..."
        rows={5}
        className="font-body w-full resize-none rounded-2xl border-2 border-sprout-charcoal/15 bg-white px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-sprout-moss/50 transition-colors duration-300"
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-sprout-charcoal/35">
          {text.length}/{MAX_NOTE_LENGTH}
        </span>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!text.trim() || isGenerating}
          className="btn-pixel pressable px-4 py-2 text-xs font-bold bg-sprout-sage disabled:bg-sprout-charcoal/10"
        >
          {isGenerating ? 'Generating…' : 'Generate Quiz'}
        </button>
      </div>

      {lastError && (
        <p className="text-xs font-semibold text-sprout-charcoal/70 bg-sprout-blushSoft/35 rounded-xl px-3 py-2 animate-fadeIn">
          {lastError}
        </p>
      )}

      {notesNewestFirst.length === 0 ? (
        <p className="text-sm text-sprout-charcoal/45 italic py-3 text-center">
          No study notes yet — jot something down above and generate your first quiz.
        </p>
      ) : (
        <ul className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {notesNewestFirst.map((note) => (
            <StudyNoteEntry key={note.id} note={note} onDelete={() => deleteStudyNote(note.id)} />
          ))}
        </ul>
      )}
    </div>
  )
}

function StudyNoteEntry({ note, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = note.text.length > 140

  return (
    <li className="rounded-2xl border-2 border-sprout-charcoal/10 bg-white/70 p-3.5 animate-fadeIn">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-sprout-charcoal/45 font-semibold">
            {new Date(note.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
          <p className={`text-sm text-sprout-charcoal/80 mt-0.5 whitespace-pre-wrap ${expanded ? '' : 'line-clamp-2'}`}>
            {note.text}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-[11px] font-bold text-sprout-moss underline mt-1"
            >
              {expanded ? 'Show less' : 'Show full note'}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete note"
          className="shrink-0 p-1 opacity-35 hover:opacity-70 transition-opacity duration-300"
        >
          <PixelIcon name="close" size={10} />
        </button>
      </div>

      <div className="mt-2.5">
        {note.status === 'success' && Array.isArray(note.quiz) && note.quiz.length > 0 ? (
          <div className="space-y-2">
            {note.quiz.map((q, i) => (
              <QuizQuestion key={i} index={i} question={q} />
            ))}
          </div>
        ) : (
          <p className="text-xs italic text-sprout-charcoal/40">{FRIENDLY_ERROR}</p>
        )}
      </div>
    </li>
  )
}

function QuizQuestion({ index, question }) {
  const [revealed, setRevealed] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const hasOptions = question.type === 'multiple_choice' && Array.isArray(question.options) && question.options.length > 0

  return (
    <div className="rounded-xl bg-sprout-cream/70 border border-sprout-charcoal/10 p-2.5">
      <p className="text-xs font-bold text-sprout-charcoal/80 leading-snug">
        {index + 1}. {question.question}
      </p>

      {hasOptions ? (
        <div className="mt-1.5 space-y-1">
          {question.options.map((opt, oi) => {
            const isCorrectOption = revealed && String(opt).trim() === String(question.answer).trim()
            const isPickedWrong = revealed && selectedIndex === oi && !isCorrectOption
            return (
              <button
                key={oi}
                type="button"
                onClick={() => {
                  setSelectedIndex(oi)
                  setRevealed(true)
                }}
                className={`w-full text-left text-[11px] rounded-lg px-2 py-1.5 border transition-colors duration-300 ${
                  isCorrectOption
                    ? 'bg-sprout-sage/45 border-sprout-moss/40 font-bold text-sprout-charcoal'
                    : isPickedWrong
                      ? 'bg-sprout-blushSoft/45 border-sprout-blush/40'
                      : 'bg-white border-sprout-charcoal/10 hover:bg-sprout-sage/10'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="mt-1.5 text-[11px] font-bold text-sprout-moss underline"
        >
          {revealed ? 'Hide answer' : 'Show answer'}
        </button>
      )}

      {revealed && !hasOptions && (
        <p className="mt-1.5 text-[11px] text-sprout-charcoal/70 bg-white rounded-lg px-2 py-1.5 animate-fadeIn">
          {question.answer}
        </p>
      )}
      {revealed && hasOptions && (
        <p className="mt-1.5 text-[10px] text-sprout-charcoal/45 animate-fadeIn">
          Correct answer: <span className="font-bold text-sprout-moss">{question.answer}</span>
        </p>
      )}
    </div>
  )
}

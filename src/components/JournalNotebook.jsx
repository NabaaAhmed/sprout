import { useMemo, useState } from 'react'
import { useGame } from '../context/GameContext'
import { PixelIcon } from './icons/PixelIcon'

function previewLine(content) {
  const line = String(content ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!line) return 'Empty page'
  return line.length > 72 ? `${line.slice(0, 72)}…` : line
}

function formatEdited(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

/**
 * Multi-page personal notebook for Journal — no AI, local-only.
 */
export function JournalNotebook() {
  const { state, addJournalPage, updateJournalPage, deleteJournalPage } = useGame()
  const pages = state.journalPages ?? []

  const [view, setView] = useState('list') // list | page
  const [activeId, setActiveId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameDraft, setRenameDraft] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [animKey, setAnimKey] = useState(0)

  const activePage = useMemo(() => pages.find((p) => p.id === activeId) ?? null, [pages, activeId])

  const openPage = (id) => {
    setActiveId(id)
    setView('page')
    setRenaming(false)
    setConfirmDelete(false)
    setAnimKey((k) => k + 1)
  }

  const backToList = () => {
    setView('list')
    setActiveId(null)
    setRenaming(false)
    setConfirmDelete(false)
    setCreating(false)
    setAnimKey((k) => k + 1)
  }

  const handleCreate = () => {
    const id = addJournalPage(newTitle)
    if (!id) return
    setNewTitle('')
    setCreating(false)
    openPage(id)
  }

  const startRename = () => {
    if (!activePage) return
    setRenameDraft(activePage.title)
    setRenaming(true)
    setConfirmDelete(false)
  }

  const commitRename = () => {
    if (!activePage) return
    updateJournalPage(activePage.id, { title: renameDraft })
    setRenaming(false)
  }

  const handleDelete = () => {
    if (!activePage) return
    deleteJournalPage(activePage.id)
    backToList()
  }

  return (
    <div className="panel-paper w-full max-w-md p-5 space-y-3 overflow-hidden">
      <div className="flex items-center gap-2">
        <PixelIcon name="pencil" size={14} />
        <p className="text-xs font-bold text-sprout-charcoal/50">My notes</p>
      </div>
      <p className="text-[11px] text-sprout-charcoal/40 leading-relaxed -mt-1">
        No AI, just yours — one page per class or subject.
      </p>

      {view === 'list' ? (
        <div key={`list-${animKey}`} className="space-y-3 animate-fadeIn">
          {pages.length === 0 ? (
            <p className="text-sm text-sprout-charcoal/45 italic py-4 text-center">
              No pages yet — start a new one below.
            </p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
              {pages.map((page) => (
                <li key={page.id}>
                  <button
                    type="button"
                    onClick={() => openPage(page.id)}
                    className="w-full text-left rounded-2xl border-2 border-sprout-charcoal/10 bg-white/80 px-3.5 py-3 hover:border-sprout-moss/35 hover:bg-sprout-sage/10 transition-colors duration-300"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-sm text-sprout-charcoal/85 truncate">{page.title}</span>
                      <span className="shrink-0 text-[10px] text-sprout-charcoal/35 font-semibold">
                        {formatEdited(page.lastEdited)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-sprout-charcoal/45 truncate">{previewLine(page.content)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {creating ? (
            <div className="rounded-2xl border-2 border-sprout-moss/30 bg-sprout-sage/10 p-3 space-y-2 animate-fadeIn">
              <p className="text-[11px] font-bold text-sprout-charcoal/50">New page title</p>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value.slice(0, 60))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') {
                    setCreating(false)
                    setNewTitle('')
                  }
                }}
                placeholder="e.g., CSCI 1730, Biology, African Studies"
                autoFocus
                className="font-body w-full rounded-xl border-2 border-sprout-charcoal/15 bg-white px-3 py-2 text-sm focus:outline-none focus:border-sprout-moss/50"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false)
                    setNewTitle('')
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-sprout-charcoal/50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newTitle.trim()}
                  className="btn-pixel pressable px-3 py-1.5 text-xs font-bold bg-sprout-sage disabled:opacity-40"
                >
                  Create
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="btn-pixel pressable w-full py-2.5 text-xs font-bold bg-sprout-peachSoft/70"
            >
              + New Page
            </button>
          )}
        </div>
      ) : (
        activePage && (
          <div key={`page-${animKey}`} className="space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={backToList}
                className="shrink-0 p-1.5 rounded-xl hover:bg-sprout-sage/20 transition-colors"
                aria-label="Back to pages"
              >
                <span className="text-sm font-bold text-sprout-moss">←</span>
              </button>

              {renaming ? (
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <input
                    type="text"
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value.slice(0, 60))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename()
                      if (e.key === 'Escape') setRenaming(false)
                    }}
                    autoFocus
                    className="font-body flex-1 min-w-0 rounded-xl border-2 border-sprout-charcoal/15 bg-white px-2.5 py-1.5 text-sm font-bold focus:outline-none focus:border-sprout-moss/50"
                  />
                  <button
                    type="button"
                    onClick={commitRename}
                    disabled={!renameDraft.trim()}
                    className="btn-pixel pressable px-2.5 py-1.5 text-[11px] font-bold bg-sprout-sage disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                  <h3 className="font-bold text-sm text-sprout-charcoal/85 truncate">{activePage.title}</h3>
                  <button
                    type="button"
                    onClick={startRename}
                    className="shrink-0 p-1 opacity-45 hover:opacity-80 transition-opacity"
                    aria-label="Rename page"
                  >
                    <PixelIcon name="pencil" size={11} />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setConfirmDelete((v) => !v)
                  setRenaming(false)
                }}
                className="shrink-0 p-1.5 rounded-xl opacity-40 hover:opacity-80 hover:bg-sprout-blushSoft/40 transition-all"
                aria-label="Delete page"
              >
                <PixelIcon name="close" size={11} />
              </button>
            </div>

            {confirmDelete && (
              <div className="rounded-xl border border-sprout-blush/40 bg-sprout-blushSoft/30 px-3 py-2.5 space-y-2 animate-fadeIn">
                <p className="text-[11px] font-semibold text-sprout-charcoal/70">
                  Delete “{activePage.title}”? This can’t be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1 text-[11px] font-bold text-sprout-charcoal/50"
                  >
                    Keep
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="btn-pixel pressable px-3 py-1 text-[11px] font-bold bg-sprout-blushSoft"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}

            <textarea
              value={activePage.content}
              onChange={(e) => updateJournalPage(activePage.id, { content: e.target.value })}
              placeholder="Write whatever you need here…"
              rows={10}
              className="font-body w-full resize-y min-h-[12rem] rounded-2xl border-2 border-sprout-charcoal/15 bg-white px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-sprout-moss/50 transition-colors duration-300"
            />
            <p className="text-[10px] text-sprout-charcoal/35">Saved automatically on this device.</p>
          </div>
        )
      )}
    </div>
  )
}

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { noteApi } from '../api/noteApi'
import { useUpdateNote, useAiNoteAssist } from '../api/useNotes'
import { SlashCommandMenu } from '@/features/cards/components/SlashCommandMenu'
import {
  type SlashCommand,
  SLASH_COMMANDS,
  filterSlashCommands,
} from '@/features/cards/components/SlashCommandMenu/slashCommands'
import { getCaretCoordinates } from '@/features/cards/components/SlashCommandMenu/getCaretCoordinates'
import type { StickyNoteColor } from '../types'
import { NOTE_COLORS } from '../types'
import './NotePopupPage.css'

const AI_SLASH_COMMANDS: SlashCommand[] = [
  { id: 'ai-help',     label: 'IA: Ajudar a escrever', keywords: ['ia','ai','ajudar','escrever','help'],    icon: '✨', prefix: '', suffix: '', cursorAfterPrefix: false },
  { id: 'ai-fix',      label: 'IA: Corrigir texto',    keywords: ['ia','ai','corrigir','fix','gramatica'],   icon: '🔧', prefix: '', suffix: '', cursorAfterPrefix: false },
  { id: 'ai-organize', label: 'IA: Organizar nota',    keywords: ['ia','ai','organizar','organize'],         icon: '📋', prefix: '', suffix: '', cursorAfterPrefix: false },
  { id: 'ai-expand',   label: 'IA: Expandir conteúdo', keywords: ['ia','ai','expandir','expand','detalhar'], icon: '📝', prefix: '', suffix: '', cursorAfterPrefix: false },
]
const ALL_COMMANDS = [...AI_SLASH_COMMANDS, ...SLASH_COMMANDS]

// Tells the WPF NotePopupWindow to start a native drag or close the window.
function postToWpf(message: string) {
  (window as unknown as { chrome?: { webview?: { postMessage?: (m: string) => void } } })
    .chrome?.webview?.postMessage?.(message)
}

export function NotePopupPage() {
  const [params] = useSearchParams()
  const noteId = params.get('id') ?? ''

  const { data: note, isLoading } = useQuery({
    queryKey: ['sticky-note-popup', noteId],
    queryFn: () => noteApi.get(noteId),
    enabled: !!noteId,
    refetchInterval: 5000,
  })

  const updateNote = useUpdateNote()
  const aiAssist = useAiNoteAssist()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Slash command state — dual ref+state to avoid stale closures
  const slashOpenRef   = useRef(false)
  const slashFilterRef = useRef('')
  const slashStartRef  = useRef(-1)
  const [slashOpen, setSlashOpenState]     = useState(false)
  const [slashFilter, setSlashFilterState] = useState('')
  const [slashIndex, setSlashIndex]        = useState(0)
  const [slashPos, setSlashPos]            = useState<{ top: number; left: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const setSlashOpen   = (v: boolean) => { slashOpenRef.current = v; setSlashOpenState(v) }
  const setSlashFilter = (v: string)  => { slashFilterRef.current = v; setSlashFilterState(v) }

  // Sync note data into local state on first load
  useEffect(() => {
    if (!note) return
    setTitle(note.title)
    setContent(note.content)
    setIsEditing(!note.content)           // start in edit mode when note is empty
    document.title = note.title || 'Nota'
  }, [note?.id])                          // only on mount / id change, not every refetch

  // Sync server changes while the popup is open (only when not actively editing)
  useEffect(() => {
    if (!note || isEditing) return
    setTitle(note.title)
    setContent(note.content)
  }, [note?.title, note?.content])

  // Set body background from note color
  useEffect(() => {
    if (!note) return
    const colors = NOTE_COLORS[note.color as StickyNoteColor]
    document.body.style.background = colors.bg
  }, [note?.color])

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerSave = useCallback((newTitle: string, newContent: string) => {
    if (!note) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      updateNote.mutate({ id: note.id, data: { title: newTitle, content: newContent, color: note.color } })
    }, 800)
  }, [note, updateNote])

  const handleAiAction = useCallback(async (action: 'help' | 'fix' | 'organize' | 'expand') => {
    const ta = textareaRef.current
    if (!ta) return
    setAiLoading(true)
    setAiError(null)
    try {
      const result = await aiAssist.mutateAsync({ content: ta.value, action })
      setContent(result.content)
      ta.value = result.content
      triggerSave(title, result.content)
      setIsEditing(false)    // show formatted preview after AI action
    } catch {
      setAiError('Erro ao consultar IA. Verifique sua chave de API nas configurações.')
    } finally {
      setAiLoading(false)
    }
  }, [aiAssist, triggerSave, title])

  const applySlashCommand = useCallback((cmd: SlashCommand) => {
    const ta = textareaRef.current
    if (!ta) return

    setSlashOpen(false)

    if (cmd.id === 'ai-help')     { void handleAiAction('help');     return }
    if (cmd.id === 'ai-fix')      { void handleAiAction('fix');      return }
    if (cmd.id === 'ai-organize') { void handleAiAction('organize'); return }
    if (cmd.id === 'ai-expand')   { void handleAiAction('expand');   return }

    const currentContent = ta.value
    const start = slashStartRef.current
    const end   = start + 1 + slashFilterRef.current.length
    const before = currentContent.slice(0, start)
    const after  = currentContent.slice(end)
    const newContent = before + cmd.prefix + (cmd.cursorAfterPrefix ? '' : cmd.suffix) + after + (cmd.cursorAfterPrefix ? cmd.suffix : '')

    ta.value = newContent
    setContent(newContent)
    triggerSave(title, newContent)

    requestAnimationFrame(() => {
      const cursorPos = start + cmd.prefix.length
      ta.setSelectionRange(cursorPos, cursorPos)
      ta.focus()
    })
  }, [handleAiAction, triggerSave, title])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val    = e.target.value
    const cursor = e.target.selectionStart ?? 0
    setContent(val)
    triggerSave(title, val)

    const textBefore = val.slice(0, cursor)
    const slashIdx   = textBefore.lastIndexOf('/')
    if (slashIdx >= 0 && (slashIdx === 0 || /[\s\n]/.test(textBefore[slashIdx - 1]))) {
      const filter = textBefore.slice(slashIdx + 1)
      if (!filter.includes(' ') && !filter.includes('\n')) {
        slashStartRef.current = slashIdx
        setSlashFilter(filter)
        setSlashIndex(0)
        setSlashOpen(true)
        const coords = getCaretCoordinates(e.target, cursor)
        setSlashPos({ top: coords.top, left: coords.left })
        return
      }
    }
    setSlashOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashOpenRef.current) {
      const filtered = filterSlashCommands(ALL_COMMANDS, slashFilterRef.current)
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIndex(i => Math.min(i + 1, filtered.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIndex(i => Math.max(i - 1, 0)) }
      else if (e.key === 'Enter' && filtered.length > 0) { e.preventDefault(); applySlashCommand(filtered[slashIndex]) }
      else if (e.key === 'Escape') { setSlashOpen(false) }
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      e.currentTarget.blur()
    }
  }

  const enterEditMode = () => {
    setIsEditing(true)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const filteredCommands = filterSlashCommands(ALL_COMMANDS, slashFilter)
  const colors = note ? NOTE_COLORS[note.color as StickyNoteColor] : NOTE_COLORS.yellow

  if (isLoading || !note) {
    return <div className="popup-loading">Carregando nota...</div>
  }

  return (
    <div className="popup-root" style={{ '--note-bg': colors.bg, '--note-header': colors.header } as React.CSSProperties}>
      {/* Header — drag region for WPF native drag */}
      <div
        className="popup-header"
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest('input, button')) return
          e.preventDefault()
          postToWpf('drag-start')
        }}
      >
        <input
          className="popup-title"
          value={title}
          onChange={e => { setTitle(e.target.value); triggerSave(e.target.value, content) }}
          placeholder="Título da nota..."
          maxLength={200}
        />
        <button
          type="button"
          className="popup-close"
          title="Fechar"
          onClick={() => { postToWpf('close'); window.close() }}
        >✕</button>
      </div>

      <div className="popup-body">
        {aiLoading && (
          <div className="popup-ai-loading">
            <span className="popup-ai-dot" />
            IA processando...
          </div>
        )}
        {aiError && (
          <div className="popup-ai-error">
            {aiError}
            <button type="button" onClick={() => setAiError(null)}>✕</button>
          </div>
        )}

        {isEditing || aiLoading ? (
          <textarea
            ref={textareaRef}
            className="popup-textarea"
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (content) setIsEditing(false) }}
            placeholder="Escreva sua nota... (use / para comandos e /ia para ajuda da IA)"
            disabled={aiLoading}
            autoFocus
          />
        ) : (
          <div
            className="popup-preview"
            onClick={enterEditMode}
            title="Clique para editar"
          >
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <span className="popup-preview-placeholder">Clique para editar...</span>
            )}
          </div>
        )}

        <SlashCommandMenu
          open={isEditing && slashOpen && filteredCommands.length > 0}
          filteredCommands={filteredCommands}
          selectedIndex={slashIndex}
          onSelectIndex={setSlashIndex}
          onSelect={applySlashCommand}
          onClose={() => setSlashOpen(false)}
          position={slashPos}
        />
      </div>
    </div>
  )
}

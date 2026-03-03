import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { StickyNote as StickyNoteType, StickyNoteColor } from '../../types'
import { NOTE_COLORS } from '../../types'
import { useUpdateNote, useDeleteNote, useAiNoteAssist, useUpdateNotePosition } from '../../api/useNotes'
import { SlashCommandMenu } from '@/features/cards/components/SlashCommandMenu'
import {
  type SlashCommand,
  SLASH_COMMANDS,
  filterSlashCommands,
} from '@/features/cards/components/SlashCommandMenu/slashCommands'
import { getCaretCoordinates } from '@/features/cards/components/SlashCommandMenu/getCaretCoordinates'
import './StickyNote.css'

const AI_SLASH_COMMANDS: SlashCommand[] = [
  { id: 'ai-help',     label: 'IA: Ajudar a escrever', keywords: ['ia','ai','ajudar','escrever','help'],    icon: '✨', prefix: '', suffix: '', cursorAfterPrefix: false },
  { id: 'ai-fix',      label: 'IA: Corrigir texto',    keywords: ['ia','ai','corrigir','fix','gramatica'],   icon: '🔧', prefix: '', suffix: '', cursorAfterPrefix: false },
  { id: 'ai-organize', label: 'IA: Organizar nota',    keywords: ['ia','ai','organizar','organize'],         icon: '📋', prefix: '', suffix: '', cursorAfterPrefix: false },
  { id: 'ai-expand',   label: 'IA: Expandir conteúdo', keywords: ['ia','ai','expandir','expand','detalhar'], icon: '📝', prefix: '', suffix: '', cursorAfterPrefix: false },
]
const ALL_NOTE_COMMANDS = [...AI_SLASH_COMMANDS, ...SLASH_COMMANDS]

interface StickyNoteProps {
  note: StickyNoteType
}

export function StickyNote({ note }: StickyNoteProps) {
  const [title, setTitle]     = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [color, setColor]     = useState<StickyNoteColor>(note.color as StickyNoteColor)
  const [noteWidth, setNoteWidth]   = useState(() => note.width  > 0 ? note.width  : 270)
  const [noteHeight, setNoteHeight] = useState(() => note.height > 0 ? note.height : 220)
  const [isEditing, setIsEditing]                 = useState(!note.content)
  const [isMinimized, setIsMinimized]             = useState(true)
  const [showColorPicker, setShowColorPicker]     = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState<string | null>(null)

  // Dual ref+state for slash command — no stale closures
  const slashOpenRef   = useRef(false)
  const slashFilterRef = useRef('')
  const slashStartRef  = useRef(-1)
  const [slashOpen, _setSlashOpen]     = useState(false)
  const [slashFilter, _setSlashFilter] = useState('')
  const [slashIndex, setSlashIndex]    = useState(0)
  const [slashPos, setSlashPos]        = useState<{ top: number; left: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const setSlashOpen   = useCallback((v: boolean) => { slashOpenRef.current = v;   _setSlashOpen(v) }, [])
  const setSlashFilter = useCallback((v: string)  => { slashFilterRef.current = v; _setSlashFilter(v) }, [])

  const updateNote     = useUpdateNote()
  const deleteNote     = useDeleteNote()
  const aiAssist       = useAiNoteAssist()
  const updatePosition = useUpdateNotePosition()

  const colors = NOTE_COLORS[color]

  // Refs for auto-save (avoid stale closures in timeout)
  const titleRef   = useRef(title);   titleRef.current   = title
  const contentRef = useRef(content); contentRef.current = content
  const colorRef   = useRef(color);   colorRef.current   = color

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!isDirty) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      updateNote.mutate({ id: note.id, data: { title: titleRef.current, content: contentRef.current, color: colorRef.current } })
      setIsDirty(false)
    }, 800)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [isDirty, note.id, updateNote])

  // Sync server changes only when not actively editing
  useEffect(() => { setTitle(note.title) }, [note.title])
  useEffect(() => { if (!isEditing) setContent(note.content) }, [note.content])
  useEffect(() => { setColor(note.color as StickyNoteColor) }, [note.color])
  useEffect(() => { if (note.width  > 0) setNoteWidth(note.width)  }, [note.width])
  useEffect(() => { if (note.height > 0) setNoteHeight(note.height) }, [note.height])

  // ---- Resize handle ----
  const noteWidthRef  = useRef(noteWidth);  noteWidthRef.current  = noteWidth
  const noteHeightRef = useRef(noteHeight); noteHeightRef.current = noteHeight
  const notePositionXRef = useRef(note.positionX); notePositionXRef.current = note.positionX

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startW = noteWidthRef.current
    const startH = noteHeightRef.current
    const onMove = (ev: MouseEvent) => {
      setNoteWidth(Math.max(200, startW + ev.clientX - startX))
      setNoteHeight(Math.max(120, startH + ev.clientY - startY))
    }
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const newW = Math.max(200, startW + ev.clientX - startX)
      const newH = Math.max(120, startH + ev.clientY - startY)
      setNoteWidth(newW)
      setNoteHeight(newH)
      updatePosition.mutate({
        id: note.id,
        data: { positionX: notePositionXRef.current, positionY: 0, width: newW, height: newH, zIndex: 0 },
      })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [note.id, updatePosition])

  // ---- dnd-kit sortable ----
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id })

  // ---- Detach ----
  const handleDetach = () => {
    window.open(
      `/notes/popup?id=${note.id}`,
      `note-popup-${note.id}`,
      `width=292,height=252,resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`
    )
  }

  // ---- AI ----
  const handleAiAction = useCallback(async (action: 'help' | 'fix' | 'organize' | 'expand') => {
    const ta = textareaRef.current
    if (!ta) return
    setAiLoading(true)
    setAiError(null)
    try {
      const result = await aiAssist.mutateAsync({ content: ta.value, action })
      ta.value = result.content
      setContent(result.content)
      setIsDirty(true)
      setIsEditing(false)
    } catch {
      setAiError('Erro ao consultar IA. Verifique a chave de API nas configurações.')
    } finally {
      setAiLoading(false)
    }
  }, [aiAssist])

  // ---- Slash apply ----
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
    const newContent = currentContent.slice(0, start) + cmd.prefix + cmd.suffix + currentContent.slice(end)
    ta.value = newContent
    setContent(newContent)
    setIsDirty(true)
    requestAnimationFrame(() => {
      const c = start + cmd.prefix.length
      ta.setSelectionRange(c, c)
      ta.focus()
    })
  }, [handleAiAction, setSlashOpen])

  // ---- Content change + slash detection ----
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val    = e.target.value
    const cursor = e.target.selectionStart ?? 0
    setContent(val)
    setIsDirty(true)
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
      const filtered = filterSlashCommands(ALL_NOTE_COMMANDS, slashFilterRef.current)
      if (e.key === 'ArrowDown')  { e.preventDefault(); setSlashIndex(i => Math.min(i + 1, filtered.length - 1)) }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); setSlashIndex(i => Math.max(i - 1, 0)) }
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

  const filteredCommands = filterSlashCommands(ALL_NOTE_COMMANDS, slashFilter)

  return (
    <div
      ref={setNodeRef}
      className={`sticky-note${isMinimized ? ' sticky-note--minimized' : ''}${isDragging ? ' sticky-note--dragging' : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        '--note-bg': colors.bg,
        '--note-header': colors.header,
        width: noteWidth,
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="note-header">
        <span className="note-drag-icon" aria-hidden title="Arrastar para reordenar" {...attributes} {...listeners}>⠿</span>
        <input
          className="note-title-input"
          value={title}
          onChange={e => { setTitle(e.target.value); setIsDirty(true) }}
          placeholder="Título da nota..."
          maxLength={200}
        />
        <div className="note-toolbar">
          {/* Minimize / expand */}
          <button
            type="button"
            className="note-btn"
            title={isMinimized ? 'Expandir nota' : 'Minimizar nota'}
            onClick={() => setIsMinimized(v => !v)}
          >{isMinimized ? '▼' : '▲'}</button>

          {/* Color picker */}
          <div className="note-color-picker-wrap">
            <button type="button" className="note-btn" title="Mudar cor" onClick={() => setShowColorPicker(v => !v)}>🎨</button>
            {showColorPicker && (
              <div className="note-color-picker">
                {(Object.keys(NOTE_COLORS) as StickyNoteColor[]).map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`note-color-swatch ${c === color ? 'active' : ''}`}
                    style={{ background: NOTE_COLORS[c].header }}
                    title={NOTE_COLORS[c].label}
                    onClick={() => { setColor(c); setIsDirty(true); setShowColorPicker(false) }}
                  />
                ))}
              </div>
            )}
          </div>

          <button type="button" className="note-btn" title="Abrir como janela flutuante" onClick={handleDetach}>⧉</button>

          {showDeleteConfirm ? (
            <>
              <button type="button" className="note-btn note-btn--danger" title="Confirmar exclusão" onClick={() => deleteNote.mutate(note.id)}>✓</button>
              <button type="button" className="note-btn" title="Cancelar" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </>
          ) : (
            <button type="button" className="note-btn" title="Excluir nota" onClick={() => setShowDeleteConfirm(true)}>🗑</button>
          )}
        </div>
      </div>

      {/* Body — hidden when minimized */}
      {!isMinimized && (
        <div className="note-body" style={{ height: noteHeight - 36 }}>
          {aiLoading && (
            <div className="note-ai-loading">
              <span className="note-ai-loading-dot" />
              <span>IA processando...</span>
            </div>
          )}
          {aiError && (
            <div className="note-ai-error">
              <span>{aiError}</span>
              <button type="button" onClick={() => setAiError(null)}>✕</button>
            </div>
          )}

          {isEditing || aiLoading ? (
            <textarea
              ref={textareaRef}
              className="note-textarea"
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              onBlur={() => { if (content) setIsEditing(false) }}
              placeholder="Escreva sua nota... (use / para comandos e /ia para IA)"
              disabled={aiLoading}
            />
          ) : (
            <div className="note-preview" onClick={enterEditMode} title="Clique para editar">
              {content
                ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                : <span className="note-preview-placeholder">Clique para editar...</span>
              }
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
      )}

      {/* Resize handle — bottom-right corner, only when expanded */}
      {!isMinimized && (
        <div className="note-resize-handle" onMouseDown={handleResizeStart} />
      )}
    </div>
  )
}

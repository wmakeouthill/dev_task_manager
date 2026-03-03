import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { StickyNote as StickyNoteType, StickyNoteColor } from '../../types'
import { NOTE_COLORS } from '../../types'
import { useUpdateNote, useUpdateNotePosition, useDeleteNote, useAiNoteAssist } from '../../api/useNotes'
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
  onBringToFront: (id: string) => void
}

export function StickyNote({ note, onBringToFront }: StickyNoteProps) {
  const [title, setTitle]     = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [color, setColor]     = useState<StickyNoteColor>(note.color as StickyNoteColor)
  const [isEditing, setIsEditing]                 = useState(!note.content)   // edit mode when empty
  const [showColorPicker, setShowColorPicker]     = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState<string | null>(null)

  // Dual ref+state: refs read in callbacks (no stale closures),
  // state triggers re-render and feeds SlashCommandMenu via props
  const slashOpenRef   = useRef(false)
  const slashFilterRef = useRef('')
  const slashStartRef  = useRef(-1)
  const [slashOpen, _setSlashOpen]     = useState(false)
  const [slashFilter, _setSlashFilter] = useState('')
  const [slashIndex, setSlashIndex]    = useState(0)
  const [slashPos, setSlashPos]        = useState<{ top: number; left: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const setSlashOpen   = useCallback((v: boolean) => { slashOpenRef.current = v;   _setSlashOpen(v) },   [])
  const setSlashFilter = useCallback((v: string)  => { slashFilterRef.current = v; _setSlashFilter(v) }, [])

  // Drag & resize
  const [pos, setPos]   = useState({ x: note.positionX, y: note.positionY })
  const [size, setSize] = useState({ w: note.width, h: note.height })
  const dragRef   = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 })
  const resizeRef = useRef({ resizing: false, startX: 0, startY: 0, origW: 0, origH: 0 })

  const updateNote     = useUpdateNote()
  const updatePosition = useUpdateNotePosition()
  const deleteNote     = useDeleteNote()
  const aiAssist       = useAiNoteAssist()

  const colors = NOTE_COLORS[color]

  // Refs for auto-save (read in timeout without stale closures)
  const titleRef   = useRef(title)
  const contentRef = useRef(content)
  const colorRef   = useRef(color)
  titleRef.current   = title
  contentRef.current = content
  colorRef.current   = color

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

  // Sync external changes (server refetch) — only when not actively editing
  useEffect(() => { setTitle(note.title) }, [note.title])
  useEffect(() => { if (!isEditing) setContent(note.content) }, [note.content])
  useEffect(() => { setColor(note.color as StickyNoteColor) }, [note.color])
  useEffect(() => { setPos({ x: note.positionX, y: note.positionY }) }, [note.positionX, note.positionY])
  useEffect(() => { setSize({ w: note.width, h: note.height }) }, [note.width, note.height])

  // ---- Drag ----
  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.note-toolbar')) return
    e.preventDefault()
    onBringToFront(note.id)
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.dragging) return
      setPos({ x: Math.max(0, dragRef.current.origX + ev.clientX - dragRef.current.startX), y: Math.max(0, dragRef.current.origY + ev.clientY - dragRef.current.startY) })
    }
    const onUp = (ev: MouseEvent) => {
      if (!dragRef.current.dragging) return
      dragRef.current.dragging = false
      const newX = Math.max(0, dragRef.current.origX + ev.clientX - dragRef.current.startX)
      const newY = Math.max(0, dragRef.current.origY + ev.clientY - dragRef.current.startY)
      updatePosition.mutate({ id: note.id, data: { positionX: newX, positionY: newY, width: size.w, height: size.h, zIndex: note.zIndex } })
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ---- Resize ----
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { resizing: true, startX: e.clientX, startY: e.clientY, origW: size.w, origH: size.h }
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current.resizing) return
      setSize({ w: Math.max(200, resizeRef.current.origW + ev.clientX - resizeRef.current.startX), h: Math.max(140, resizeRef.current.origH + ev.clientY - resizeRef.current.startY) })
    }
    const onUp = (ev: MouseEvent) => {
      if (!resizeRef.current.resizing) return
      resizeRef.current.resizing = false
      const newW = Math.max(200, resizeRef.current.origW + ev.clientX - resizeRef.current.startX)
      const newH = Math.max(140, resizeRef.current.origH + ev.clientY - resizeRef.current.startY)
      updatePosition.mutate({ id: note.id, data: { positionX: pos.x, positionY: pos.y, width: newW, height: newH, zIndex: note.zIndex } })
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ---- Detach: opens real OS window via window.open ----
  const handleDetach = () => {
    const w = Math.round(size.w) + 2
    const h = Math.round(size.h) + 32
    window.open(
      `/notes/popup?id=${note.id}`,
      `note-popup-${note.id}`,
      `width=${w},height=${h},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`
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
      setIsEditing(false)    // show formatted preview after AI action
    } catch {
      setAiError('Erro ao consultar IA. Verifique a chave de API nas configurações.')
    } finally {
      setAiLoading(false)
    }
  }, [aiAssist])

  // ---- Slash apply ----
  // Uses ta.value (DOM, always current) + refs — no stale closures
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
    const end = start + 1 + slashFilterRef.current.length

    const before = currentContent.slice(0, start)
    const after  = currentContent.slice(end)
    const newContent = before + cmd.prefix + cmd.suffix + after

    ta.value = newContent
    setContent(newContent)
    setIsDirty(true)

    requestAnimationFrame(() => {
      const cursorPos = start + cmd.prefix.length
      ta.setSelectionRange(cursorPos, cursorPos)
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

  // ---- Keyboard navigation in slash menu ----
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashOpenRef.current) {
      const filtered = filterSlashCommands(ALL_NOTE_COMMANDS, slashFilterRef.current)
      if (e.key === 'ArrowDown')  { e.preventDefault(); setSlashIndex(i => Math.min(i + 1, filtered.length - 1)) }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); setSlashIndex(i => Math.max(i - 1, 0)) }
      else if (e.key === 'Enter' && filtered.length > 0) { e.preventDefault(); applySlashCommand(filtered[slashIndex]) }
      else if (e.key === 'Escape')   { setSlashOpen(false) }
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
      className="sticky-note"
      style={{
        left: pos.x, top: pos.y,
        width: size.w, height: size.h,
        zIndex: note.zIndex + 10,
        '--note-bg': colors.bg, '--note-header': colors.header,
      } as React.CSSProperties}
      onMouseDown={() => onBringToFront(note.id)}
    >
      {/* Header / drag handle */}
      <div className="note-header" onMouseDown={handleDragStart}>
        <span className="note-drag-icon" aria-hidden>⠿</span>
        <input
          className="note-title-input"
          value={title}
          onChange={e => { setTitle(e.target.value); setIsDirty(true) }}
          placeholder="Título da nota..."
          maxLength={200}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        />
        <div className="note-toolbar" onMouseDown={e => e.stopPropagation()}>
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

      {/* Body */}
      <div className="note-body">
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
            placeholder="Escreva sua nota... (use / para comandos e /ia para ajuda da IA)"
            disabled={aiLoading}
          />
        ) : (
          <div
            className="note-preview"
            onClick={enterEditMode}
            title="Clique para editar"
          >
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <span className="note-preview-placeholder">Clique para editar...</span>
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

      <div className="note-resize-handle" onMouseDown={handleResizeStart} title="Redimensionar" />
    </div>
  )
}

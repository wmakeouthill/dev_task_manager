import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BlockNoteSchema, createCodeBlockSpec } from '@blocknote/core'
import { filterSuggestionItems } from '@blocknote/core/extensions'
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from '@blocknote/react'
import type { DefaultReactSuggestionItem } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { MantineProvider } from '@mantine/core'
import { codeBlockOptions } from '@blocknote/code-block'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import type { StickyNote as StickyNoteType, StickyNoteColor } from '../../types'
import { NOTE_COLORS } from '../../types'
import { useUpdateNote, useDeleteNote, useAiNoteAssist, useUpdateNotePosition } from '../../api/useNotes'
import { markdownComponents } from '../markdownComponents'
import './StickyNote.css'

const schema = BlockNoteSchema.create().extend({
  blockSpecs: { codeBlock: createCodeBlockSpec(codeBlockOptions) },
})

interface StickyNoteProps {
  note: StickyNoteType
}

export function StickyNote({ note }: StickyNoteProps) {
  const [title, setTitle]     = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [color, setColor]     = useState<StickyNoteColor>(note.color as StickyNoteColor)
  const [noteWidth, setNoteWidth]   = useState(() => note.width  > 0 ? note.width  : 270)
  const [noteHeight, setNoteHeight] = useState(() => note.height > 0 ? note.height : 220)
  const [isEditing, setIsEditing]             = useState(!note.content)
  const [isMinimized, setIsMinimized]         = useState(true)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState<string | null>(null)

  // Pending AI command (Discord-like: select command → type instruction → Enter)
  const [pendingAiCommand, setPendingAiCommand] = useState<{
    action: 'help' | 'fix' | 'organize' | 'expand'
    label: string
    icon: string
  } | null>(null)
  const [pendingInstruction, setPendingInstruction] = useState('')
  const pendingAiCommandRef = useRef<typeof pendingAiCommand>(null)
  const instructionRef = useRef<HTMLTextAreaElement>(null)
  const savedContentRef = useRef('')

  // BlockNote editor instance
  const editor = useCreateBlockNote({ schema })

  const updateNote     = useUpdateNote()
  const deleteNote     = useDeleteNote()
  const aiAssist       = useAiNoteAssist()
  const updatePosition = useUpdateNotePosition()

  const colors = NOTE_COLORS[color]

  // Stable refs for closures
  const titleRef   = useRef(title);   titleRef.current   = title
  const contentRef = useRef(content); contentRef.current = content
  const colorRef   = useRef(color);   colorRef.current   = color
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadingBlocksRef = useRef(false)
  const enterContentRef = useRef('')
  const baselineMdRef = useRef('')
  const userEditedRef = useRef(false)

  // Sync server changes when not editing
  useEffect(() => { setTitle(note.title) }, [note.title])
  useEffect(() => { if (!isEditing) setContent(note.content) }, [note.content, isEditing])
  useEffect(() => { setColor(note.color as StickyNoteColor) }, [note.color])
  useEffect(() => { if (note.width  > 0) setNoteWidth(note.width)  }, [note.width])
  useEffect(() => { if (note.height > 0) setNoteHeight(note.height) }, [note.height])
  useEffect(() => { pendingAiCommandRef.current = pendingAiCommand }, [pendingAiCommand])

  // Debounced save helper
  const scheduleSave = useCallback((md: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      updateNote.mutate({ id: note.id, data: { title: titleRef.current, content: md, color: colorRef.current } })
    }, 800)
  }, [note.id, updateNote])

  // BlockNote onChange — debounce-save (skip during initial block load & round-trip artifacts)
  const handleEditorChange = useCallback(async () => {
    if (loadingBlocksRef.current) return
    const md = (await editor.blocksToMarkdownLossy(editor.document)).trim()
    // Ignore if identical to baseline (round-trip artifact, not a real user edit)
    if (md === baselineMdRef.current && !userEditedRef.current) return
    userEditedRef.current = true
    contentRef.current = md
    scheduleSave(md)
  }, [editor, scheduleSave])

  // Enter edit mode: load markdown into BlockNote BEFORE showing editor
  const enterEditMode = useCallback(async () => {
    const md = contentRef.current?.trim() || ''
    enterContentRef.current = md
    userEditedRef.current = false
    try {
      const blocks = md
        ? await editor.tryParseMarkdownToBlocks(md)
        : [{ type: 'paragraph' as const }]
      loadingBlocksRef.current = true
      editor.replaceBlocks(editor.document, blocks)
      // Capture baseline after round-trip so we can detect real vs artifact changes
      // Delay reset so async onChange from replaceBlocks is ignored
      setTimeout(async () => {
        baselineMdRef.current = (await editor.blocksToMarkdownLossy(editor.document)).trim()
        loadingBlocksRef.current = false
      }, 150)
    } catch {
      loadingBlocksRef.current = false
    }
    setIsEditing(true)
    setTimeout(() => editor.focus(), 50)
  }, [editor])

  // Exit edit mode: only save if user actually typed; otherwise restore original to avoid round-trip artifacts
  const exitEditMode = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (userEditedRef.current) {
      // Get final state from editor
      const md = (await editor.blocksToMarkdownLossy(editor.document)).trim()
      setContent(md)
      contentRef.current = md
      updateNote.mutate({ id: note.id, data: { title: titleRef.current, content: md, color: colorRef.current } })
    } else {
      // No user changes — restore original content to prevent markdown round-trip adding spaces/newlines
      setContent(enterContentRef.current)
      contentRef.current = enterContentRef.current
    }
    setIsEditing(false)
  }, [editor, note.id, updateNote])

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
  const triggerAiCommand = useCallback(async (
    action: 'help' | 'fix' | 'organize' | 'expand',
    label: string,
    icon: string,
  ) => {
    const md = (await editor.blocksToMarkdownLossy(editor.document)).trim()
    savedContentRef.current = md
    setPendingInstruction('')
    setPendingAiCommand({ action, label, icon })
    requestAnimationFrame(() => instructionRef.current?.focus())
  }, [editor])

  // Stable ref so AI items in the slash menu never go stale
  const triggerAiCommandRef = useRef(triggerAiCommand)
  triggerAiCommandRef.current = triggerAiCommand

  const cancelPendingAi = useCallback(() => {
    setPendingAiCommand(null)
    setPendingInstruction('')
  }, [])

  const handleAiAction = useCallback(async (
    action: 'help' | 'fix' | 'organize' | 'expand',
    noteContent: string,
    instruction?: string,
  ) => {
    setAiLoading(true)
    setAiError(null)
    try {
      const result = await aiAssist.mutateAsync({ content: noteContent, action, instruction })
      const trimmed = result.content.trim()
      const blocks = await editor.tryParseMarkdownToBlocks(trimmed)
      editor.replaceBlocks(editor.document, blocks)
      setContent(trimmed)
      contentRef.current = trimmed
      scheduleSave(trimmed)
      setIsEditing(false)
    } catch {
      setAiError('Erro ao consultar IA. Verifique a chave de API nas configurações.')
    } finally {
      setAiLoading(false)
      setPendingAiCommand(null)
      setPendingInstruction('')
    }
  }, [aiAssist, editor, scheduleSave])

  const handleInstructionKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!pendingAiCommandRef.current) return
      void handleAiAction(
        pendingAiCommandRef.current.action,
        savedContentRef.current,
        pendingInstruction.trim() || undefined,
      )
    } else if (e.key === 'Escape') {
      cancelPendingAi()
    }
  }, [pendingInstruction, handleAiAction, cancelPendingAi])

  // ---- BlockNote custom slash menu (default items + AI items) ----
  const getSlashMenuItems = useCallback(async (query: string): Promise<DefaultReactSuggestionItem[]> => {
    const defaults = getDefaultReactSlashMenuItems(editor)
    const aiItems: DefaultReactSuggestionItem[] = [
      {
        title: 'IA: Ajudar a escrever',
        aliases: ['ia', 'ai', 'ajudar', 'help', 'escrever'],
        subtext: 'IA melhora/complementa o texto da nota',
        group: 'Inteligência Artificial',
        icon: <span>✨</span>,
        onItemClick: () => triggerAiCommandRef.current('help', 'Ajudar a escrever', '✨'),
      },
      {
        title: 'IA: Corrigir texto',
        aliases: ['ia', 'ai', 'corrigir', 'fix', 'gramatica'],
        subtext: 'IA corrige gramática e clareza',
        group: 'Inteligência Artificial',
        icon: <span>🔧</span>,
        onItemClick: () => triggerAiCommandRef.current('fix', 'Corrigir texto', '🔧'),
      },
      {
        title: 'IA: Organizar nota',
        aliases: ['ia', 'ai', 'organizar', 'organize'],
        subtext: 'IA estrutura o conteúdo em tópicos',
        group: 'Inteligência Artificial',
        icon: <span>📋</span>,
        onItemClick: () => triggerAiCommandRef.current('organize', 'Organizar nota', '📋'),
      },
      {
        title: 'IA: Expandir conteúdo',
        aliases: ['ia', 'ai', 'expandir', 'expand', 'detalhar'],
        subtext: 'IA enriquece com mais detalhes',
        group: 'Inteligência Artificial',
        icon: <span>📝</span>,
        onItemClick: () => triggerAiCommandRef.current('expand', 'Expandir conteúdo', '📝'),
      },
    ]
    return filterSuggestionItems([...defaults, ...aiItems], query)
  }, [editor])

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
        height: isMinimized ? undefined : noteHeight,
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="note-header">
        <span className="note-drag-icon" aria-hidden title="Arrastar para reordenar" {...attributes} {...listeners}>⠿</span>
        <input
          className="note-title-input"
          value={title}
          onChange={e => { setTitle(e.target.value); scheduleSave(contentRef.current) }}
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

          {/* Edit / done */}
          {!isMinimized && !pendingAiCommand && (
            <button
              type="button"
              className={`note-btn ${isEditing ? 'note-btn--active' : ''}`}
              title={isEditing ? 'Concluir edição' : 'Editar nota'}
              onClick={() => isEditing ? void exitEditMode() : void enterEditMode()}
            >{isEditing ? '✓' : '✏️'}</button>
          )}

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
                    onClick={() => { setColor(c); scheduleSave(contentRef.current); setShowColorPicker(false) }}
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

          {pendingAiCommand ? (
            /* Discord-like AI command mode */
            <>
              <div className="note-ai-pending-bar">
                <span className="note-ai-pending-icon">{pendingAiCommand.icon}</span>
                <span className="note-ai-pending-label">{pendingAiCommand.label}</span>
                <button type="button" className="note-ai-pending-cancel" title="Cancelar" onClick={cancelPendingAi}>✕</button>
              </div>
              {savedContentRef.current && (
                <div className="note-live-preview note-live-preview--dimmed" aria-hidden>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{savedContentRef.current}</ReactMarkdown>
                </div>
              )}
              <textarea
                ref={instructionRef}
                className="note-textarea note-textarea--instruction"
                value={pendingInstruction}
                onChange={e => setPendingInstruction(e.target.value)}
                onKeyDown={handleInstructionKeyDown}
                placeholder="Descreva o que quer... (Enter para confirmar, Esc para cancelar)"
                disabled={aiLoading}
                autoFocus
              />
            </>
          ) : isEditing ? (
            /* BlockNote WYSIWYG editor */
            <div
              className="note-blocknote-wrap"
              onBlur={e => {
                // Only exit if focus left the entire sticky note (not just the editor wrap)
                const stickyNote = e.currentTarget.closest('.sticky-note')
                if (stickyNote && !stickyNote.contains(e.relatedTarget as Node)) {
                  void exitEditMode()
                }
              }}
            >
              <MantineProvider forceColorScheme="dark">
                <BlockNoteView
                  editor={editor}
                  theme="dark"
                  slashMenu={false}
                  sideMenu={false}
                  onChange={handleEditorChange}
                  className="note-blocknote"
                >
                  <SuggestionMenuController
                    triggerCharacter="/"
                    getItems={getSlashMenuItems}
                  />
                </BlockNoteView>
              </MantineProvider>
            </div>
          ) : (
            /* Preview mode — text is selectable; use ✏️ button in header to edit */
            <div className="note-preview">
              {content
                ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
                : <span className="note-preview-placeholder">Clique para editar... (/ para comandos, /ia para IA)</span>
              }
            </div>
          )}
        </div>
      )}

      {/* Resize handle — bottom-right corner, only when expanded */}
      {!isMinimized && (
        <div className="note-resize-handle" onMouseDown={handleResizeStart} />
      )}
    </div>
  )
}

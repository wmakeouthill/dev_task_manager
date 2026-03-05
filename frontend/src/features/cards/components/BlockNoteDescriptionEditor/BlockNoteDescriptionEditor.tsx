import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BlockNoteSchema, createCodeBlockSpec } from '@blocknote/core'
import { filterSuggestionItems } from '@blocknote/core/extensions'
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from '@blocknote/react'
import type { DefaultReactSuggestionItem } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { MantineProvider } from '@mantine/core'
import { codeBlockOptions } from '@blocknote/code-block'
import { useAiNoteAssist } from '@/features/notes/api/useNotes'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import './BlockNoteDescriptionEditor.css'

const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    codeBlock: createCodeBlockSpec(codeBlockOptions),
  },
})

interface BlockNoteDescriptionEditorProps {
  readonly initialMarkdown: string
  readonly onSave: (markdown: string) => void
  readonly onCancel: () => void
  readonly disabled?: boolean
}

export function BlockNoteDescriptionEditor({
  initialMarkdown,
  onSave,
  onCancel,
  disabled = false,
}: BlockNoteDescriptionEditorProps) {
  const editor = useCreateBlockNote({ schema })
  const loadedRef = useRef(false)

  // AI Discord-like pending command state
  const [pendingAiCommand, setPendingAiCommand] = useState<{
    action: 'help' | 'fix' | 'organize' | 'expand'
    label: string
    icon: string
  } | null>(null)
  const [pendingInstruction, setPendingInstruction] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const pendingAiCommandRef = useRef<typeof pendingAiCommand>(null)
  const instructionRef = useRef<HTMLTextAreaElement>(null)
  const savedContentRef = useRef('')
  const aiAssist = useAiNoteAssist()

  useEffect(() => { pendingAiCommandRef.current = pendingAiCommand }, [pendingAiCommand])

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    const load = async () => {
      const markdown = initialMarkdown?.trim() || ''
      if (!markdown) return
      try {
        const blocks = await editor.tryParseMarkdownToBlocks(markdown)
        editor.replaceBlocks(editor.document, blocks)
      } catch { /* fallback: leave empty */ }
    }

    void load()
  }, [editor, initialMarkdown])

  const handleSave = async () => {
    try {
      const markdown = await editor.blocksToMarkdownLossy(editor.document)
      onSave(markdown)
    } catch {
      onSave('')
    }
  }

  // ---- AI handlers ----
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

  const triggerAiCommandRef = useRef(triggerAiCommand)
  triggerAiCommandRef.current = triggerAiCommand

  const cancelPendingAi = useCallback(() => {
    setPendingAiCommand(null)
    setPendingInstruction('')
  }, [])

  const handleAiAction = useCallback(async (
    action: 'help' | 'fix' | 'organize' | 'expand',
    content: string,
    instruction?: string,
  ) => {
    setAiLoading(true)
    setAiError(null)
    try {
      const result = await aiAssist.mutateAsync({ content, action, instruction })
      const blocks = await editor.tryParseMarkdownToBlocks(result.content.trim())
      editor.replaceBlocks(editor.document, blocks)
    } catch {
      setAiError('Erro ao consultar IA. Verifique a chave de API nas configurações.')
    } finally {
      setAiLoading(false)
      setPendingAiCommand(null)
      setPendingInstruction('')
    }
  }, [aiAssist, editor])

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

  // ---- Custom slash menu (defaults + AI items) ----
  const getSlashMenuItems = useCallback(async (query: string): Promise<DefaultReactSuggestionItem[]> => {
    const defaults = getDefaultReactSlashMenuItems(editor)
    const aiItems: DefaultReactSuggestionItem[] = [
      {
        title: 'IA: Ajudar a escrever',
        aliases: ['ia', 'ai', 'ajudar', 'help', 'escrever'],
        subtext: 'IA melhora/complementa a descrição',
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
        title: 'IA: Organizar descrição',
        aliases: ['ia', 'ai', 'organizar', 'organize'],
        subtext: 'IA estrutura em tópicos claros',
        group: 'Inteligência Artificial',
        icon: <span>📋</span>,
        onItemClick: () => triggerAiCommandRef.current('organize', 'Organizar descrição', '📋'),
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
    <MantineProvider forceColorScheme="dark">
      <div className="blocknote-desc-editor">

        {/* Pending AI command banner */}
        {pendingAiCommand && (
          <div className="desc-ai-pending-bar">
            <span>{pendingAiCommand.icon}</span>
            <span className="desc-ai-pending-label">{pendingAiCommand.label}</span>
            <button type="button" className="desc-ai-pending-cancel" onClick={cancelPendingAi}>✕</button>
          </div>
        )}

        {aiLoading && (
          <div className="desc-ai-loading">
            <span className="desc-ai-loading-dot" />
            <span>IA processando...</span>
          </div>
        )}

        {aiError && (
          <div className="desc-ai-error">
            <span>{aiError}</span>
            <button type="button" onClick={() => setAiError(null)}>✕</button>
          </div>
        )}

        <div className={`blocknote-desc-editor-inner${pendingAiCommand ? ' blocknote-desc-editor-inner--dimmed' : ''}`}>
          <BlockNoteView
            editor={editor}
            editable={!disabled && !pendingAiCommand && !aiLoading}
            theme="dark"
            slashMenu={false}
          >
            <SuggestionMenuController
              triggerCharacter="/"
              getItems={getSlashMenuItems}
            />
          </BlockNoteView>
        </div>

        {/* Instruction textarea (shown when an AI command is pending) */}
        {pendingAiCommand && (
          <>
            {savedContentRef.current && (
              <div className="desc-ai-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{savedContentRef.current}</ReactMarkdown>
              </div>
            )}
            <textarea
              ref={instructionRef}
              className="input desc-ai-instruction"
              value={pendingInstruction}
              onChange={e => setPendingInstruction(e.target.value)}
              onKeyDown={handleInstructionKeyDown}
              placeholder="Descreva o que quer... (Enter para confirmar, Esc para cancelar)"
              disabled={aiLoading}
              autoFocus
              rows={2}
            />
          </>
        )}

        <div className="blocknote-desc-editor-actions">
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={aiLoading}>
            Salvar
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </MantineProvider>
  )
}

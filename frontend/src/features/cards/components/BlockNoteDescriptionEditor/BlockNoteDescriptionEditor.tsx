import { useEffect, useRef } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { MantineProvider } from '@mantine/core'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import './BlockNoteDescriptionEditor.css'

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
  const editor = useCreateBlockNote()
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    const load = async () => {
      const markdown = initialMarkdown?.trim() || ''
      if (!markdown) return

      try {
        const blocks = await editor.tryParseMarkdownToBlocks(markdown)
        editor.replaceBlocks(editor.document, blocks)
      } catch {
        /* fallback: leave empty */
      }
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

  return (
    <MantineProvider forceColorScheme="dark">
      <div className="blocknote-desc-editor">
        <div className="blocknote-desc-editor-inner">
          <BlockNoteView
            editor={editor}
            editable={!disabled}
            theme="dark"
          />
        </div>
        <div className="blocknote-desc-editor-actions">
          <button type="button" className="btn btn-primary" onClick={handleSave}>
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

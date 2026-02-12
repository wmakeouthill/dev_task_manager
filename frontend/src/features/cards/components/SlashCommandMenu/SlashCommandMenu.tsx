import { useEffect, useRef } from 'react'
import { type SlashCommand } from './slashCommands'

export interface SlashCommandMenuProps {
  open: boolean
  filteredCommands: SlashCommand[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
  onSelect: (command: SlashCommand) => void
  onClose: () => void
  /** Posição do menu (viewport). Se definido, o menu aparece logo abaixo da linha do cursor. */
  position: { top: number; left: number } | null
}

export function SlashCommandMenu({
  open,
  filteredCommands,
  selectedIndex,
  onSelectIndex,
  onSelect,
  onClose: _onClose,
  position,
}: SlashCommandMenuProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const filtered = filteredCommands
  const style = position
    ? { position: 'fixed' as const, top: position.top, left: position.left, right: 'auto' }
    : undefined

  useEffect(() => {
    if (!open || filtered.length === 0) return
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedIndex, open, filtered.length])

  if (!open) return null

  return (
    <div
      className="slash-command-menu"
      role="listbox"
      aria-label="Comandos de formatação"
      id="slash-command-menu"
      style={style}
    >
      <div className="slash-command-menu-header">
        <span className="slash-command-menu-title">Formatação</span>
      </div>
      <ul ref={listRef} className="slash-command-menu-list">
        {filtered.length === 0 ? (
          <li className="slash-command-menu-item slash-command-menu-item-empty">
            Nenhum comando encontrado
          </li>
        ) : (
          filtered.map((cmd, i) => (
            <li
              key={cmd.id}
              className={`slash-command-menu-item ${i === selectedIndex ? 'selected' : ''}`}
              role="option"
              aria-selected={i === selectedIndex}
              onMouseEnter={() => onSelectIndex(i)}
              onClick={() => onSelect(cmd)}
            >
              <span className="slash-command-menu-icon">{cmd.icon}</span>
              <span className="slash-command-menu-label">{cmd.label}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'

export interface InsightOption {
  value: string
  label: string
  icon: string
}

const OPTIONS: InsightOption[] = [
  { value: 'board-insights', label: 'Visão geral do board', icon: '📊' },
  { value: 'bottlenecks', label: 'Identificar gargalos', icon: '🚧' },
  { value: 'priorities', label: 'Sugerir prioridades', icon: '🎯' },
  { value: 'risks', label: 'Análise de riscos', icon: '⚠️' },
  { value: 'sprint-review', label: 'Sprint review', icon: '📋' },
]

export interface InsightsDropdownProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  ariaLabel?: string
}

export function InsightsDropdown({
  value,
  onChange,
  disabled = false,
  ariaLabel = 'Tipo de insight',
}: InsightsDropdownProps) {
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0]
  const currentIndex = OPTIONS.findIndex((o) => o.value === value)
  const effectiveIndex = Math.max(0, currentIndex)

  useEffect(() => {
    if (!open) return
    setHighlightIndex(effectiveIndex)
  }, [open, effectiveIndex])

  useEffect(() => {
    if (!open) return
    const el = listRef.current?.children[highlightIndex] as HTMLElement
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [highlightIndex, open])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightIndex((i) => Math.min(i + 1, OPTIONS.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && highlightIndex >= 0 && OPTIONS[highlightIndex]) {
        e.preventDefault()
        onChange(OPTIONS[highlightIndex].value)
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, highlightIndex, onChange])

  const handleSelect = (opt: InsightOption) => {
    onChange(opt.value)
    setOpen(false)
  }

  return (
    <div className="insights-dropdown" ref={containerRef}>
      <button
        type="button"
        role="combobox"
        className="insights-dropdown-trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-activedescendant={open ? `insights-opt-${highlightIndex}` : undefined}
      >
        <span className="insights-dropdown-icon">{selected.icon}</span>
        <span className="insights-dropdown-label">{selected.label}</span>
        <span className={`insights-dropdown-chevron ${open ? 'is-open' : ''}`} aria-hidden>
          ▼
        </span>
      </button>

      {open && (
        <div className="insights-dropdown-panel">
          <div className="insights-dropdown-header">
            <span className="insights-dropdown-title">Tipo de insight</span>
          </div>
          <ul
            ref={listRef}
            className="insights-dropdown-list"
            role="listbox"
            aria-label={ariaLabel}
          >
            {OPTIONS.map((opt, i) => (
              <li
                key={opt.value}
                id={`insights-opt-${i}`}
                className={`insights-dropdown-item ${i === highlightIndex ? 'selected' : ''}`}
                role="option"
                aria-selected={opt.value === value}
                onMouseEnter={() => setHighlightIndex(i)}
                onClick={() => handleSelect(opt)}
              >
                <span className="insights-dropdown-item-icon">{opt.icon}</span>
                <span className="insights-dropdown-item-label">{opt.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

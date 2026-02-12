import { useState, useEffect, useRef } from 'react'
import { useCardSearch } from '@/features/cards/api/useCardSearch'
import type { CardSearchResult } from '@/shared/types'

interface CardReferenceMenuProps {
    /** Texto após a '/' digitada pelo usuário */
    searchText: string
    /** Posição absoluta do menu (bottom-left do cursor) */
    position: { top: number; left: number }
    onSelect: (card: CardSearchResult) => void
    onClose: () => void
}

/**
 * Menu popup exibido quando o usuário digita '/' no chat.
 * Permite buscar e selecionar um card para dar contexto à IA.
 */
export function CardReferenceMenu({ searchText, position, onSelect, onClose }: CardReferenceMenuProps) {
    const { data: results = [], isLoading } = useCardSearch(searchText)
    const [activeIndex, setActiveIndex] = useState(0)
    const menuRef = useRef<HTMLDivElement>(null)

    // Reset index quando resultados mudam
    useEffect(() => {
        setActiveIndex(0)
    }, [results])

    // Fecha ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    // Navegação por teclado: registra listener global para capturar antes do textarea
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex((i) => Math.min(i + 1, results.length - 1))
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Enter' && results.length > 0) {
                e.preventDefault()
                e.stopPropagation()
                onSelect(results[activeIndex])
            } else if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
            }
        }
        document.addEventListener('keydown', handleKeyDown, true)
        return () => document.removeEventListener('keydown', handleKeyDown, true)
    }, [results, activeIndex, onSelect, onClose])

    const statusIcon: Record<string, string> = {
        Todo: '📋',
        InProgress: '🔧',
        Done: '✅',
    }

    return (
        <div
            ref={menuRef}
            className="card-ref-menu"
            style={{ top: position.top, left: position.left }}
            role="listbox"
            aria-label="Selecione um card para referência"
        >
            <div className="card-ref-menu-header">
                <span>🔗 Referenciar card</span>
                {searchText.length < 2 && (
                    <span className="card-ref-menu-hint">Digite ao menos 2 letras…</span>
                )}
            </div>

            {isLoading && <div className="card-ref-menu-loading">Buscando…</div>}

            {!isLoading && searchText.length >= 2 && results.length === 0 && (
                <div className="card-ref-menu-empty">Nenhum card encontrado</div>
            )}

            {results.map((card, i) => (
                <button
                    key={card.id}
                    type="button"
                    className={`card-ref-menu-item ${i === activeIndex ? 'active' : ''}`}
                    onClick={() => onSelect(card)}
                    onMouseEnter={() => setActiveIndex(i)}
                    role="option"
                    aria-selected={i === activeIndex}
                >
                    <span className="card-ref-menu-item-icon">{statusIcon[card.status] ?? '📌'}</span>
                    <span className="card-ref-menu-item-title">{card.titulo}</span>
                    <span className="card-ref-menu-item-status">{card.status}</span>
                </button>
            ))}

            <div className="card-ref-menu-footer">
                <kbd>↑↓</kbd> navegar · <kbd>Enter</kbd> selecionar · <kbd>Esc</kbd> fechar
            </div>
        </div>
    )
}

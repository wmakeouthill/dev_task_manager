import type { ColumnDto } from '@/features/boards/types/board.types'
import type { Card } from '@/features/cards/types/card.types'
import type { ChecklistItemData } from '@/shared/types'

export interface SortableColumnConfig {
  column: ColumnDto
  isOverWip: boolean
  columnCards: Card[]
  loadingCards: boolean
  newCardTitulo: Record<string, string>
  setNewCardTitulo: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onAddCard: (e: React.FormEvent, columnId: string) => void
  onOpenCard: (id: string) => void
  onSettings: (col: ColumnDto) => void
  createCardPending: boolean
  /** Mapa cardId -> itens do checklist (para preview de subtarefas no card). */
  checklistByCardId?: Record<string, ChecklistItemData[]>
}

export interface SortableColumnProps {
  config: SortableColumnConfig
}

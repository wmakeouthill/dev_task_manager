import type { Card } from '@/features/cards/types/card.types'
import type { ChecklistItemData } from '@/shared/types'

export interface SortableCardProps {
  card: Card
  onOpen: (id: string) => void
  /** Subtarefas do card (preview). Mostra até 2 e indica "+ N mais" se houver mais. */
  checklistItems?: ChecklistItemData[]
}

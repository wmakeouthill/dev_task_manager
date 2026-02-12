import type { Card } from '@/features/cards/types/card.types'

export interface SortableCardProps {
  card: Card
  onOpen: (id: string) => void
}

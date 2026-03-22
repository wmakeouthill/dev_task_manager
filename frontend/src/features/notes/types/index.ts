export interface StickyNote {
  id: string
  boardId: string | null
  title: string
  content: string
  color: StickyNoteColor
  positionX: number
  positionY: number
  width: number
  height: number
  zIndex: number
  createdAt: string
  updatedAt: string
}

export type StickyNoteColor = 'yellow' | 'green' | 'pink' | 'blue' | 'purple' | 'orange' | 'gray'

export interface CreateStickyNoteRequest {
  title: string
  content: string
  color: StickyNoteColor
  positionX: number
  positionY: number
  boardId?: string
}

export interface UpdateStickyNoteRequest {
  title: string
  content: string
  color: StickyNoteColor
}

export interface UpdateStickyNotePositionRequest {
  positionX: number
  positionY: number
  width: number
  height: number
  zIndex: number
}

export interface AiNoteAssistRequest {
  content: string
  action: 'help' | 'fix' | 'organize' | 'expand'
  instruction?: string
}

export interface AiNoteAssistResponse {
  content: string
  provider: string
  durationMs: number
}

export const NOTE_COLORS: Record<StickyNoteColor, { bg: string; header: string; label: string }> = {
  yellow: { bg: '#2d2a00', header: '#3d3800', label: 'Amarelo' },
  green: { bg: '#002d1a', header: '#003d22', label: 'Verde' },
  pink: { bg: '#2d001a', header: '#3d0022', label: 'Rosa' },
  blue: { bg: '#00132d', header: '#001a3d', label: 'Azul' },
  purple: { bg: '#1a002d', header: '#22003d', label: 'Roxo' },
  orange: { bg: '#2d1200', header: '#3d1800', label: 'Laranja' },
  gray: { bg: '#1e1e1e', header: '#252525', label: 'Cinza' },
}

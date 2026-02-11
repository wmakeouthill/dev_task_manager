/** Espelha CardDto do backend .NET */
export interface Card {
  id: string
  boardId: string
  columnId: string
  titulo: string
  descricao: string | null
  status: 'Todo' | 'InProgress' | 'Done'
  ordem: number
  dueDate: string | null
  aiEnabled: boolean
  createdAt: string
}

export interface CreateCardRequest {
  columnId: string
  titulo: string
  descricao?: string | null
  ordem?: number
}

export interface UpdateCardRequest {
  titulo?: string | null
  descricao?: string | null
  dueDate?: string | null
  aiEnabled?: boolean
}

export interface MoveCardRequest {
  columnId: string
  ordem: number
}

export interface UpdateCardStatusRequest {
  status: string
}

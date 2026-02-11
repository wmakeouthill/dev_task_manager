/** Espelha ColumnDto do backend .NET */
export interface ColumnDto {
  id: string
  boardId: string
  nome: string
  ordem: number
  wipLimit: number | null
}

/** Espelha BoardDto do backend .NET */
export interface Board {
  id: string
  workspaceId: string
  nome: string
  createdAt: string
  columns: ColumnDto[]
}

export interface CreateBoardRequest {
  nome: string
}

export interface UpdateBoardRequest {
  nome: string
}

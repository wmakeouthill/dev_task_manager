/** Dashboard DTO (espelha backend) */
export interface DashboardData {
    totalCards: number
    cardsTodo: number
    cardsInProgress: number
    cardsDone: number
    cardsOverdue: number
    totalBoards: number
    totalWorkspaces: number
    pendingReminders: number
    recentCards: CardSummary[]
    overdueCards: CardSummary[]
}

export interface CardSummary {
    id: string
    boardId: string
    columnId: string
    titulo: string
    descricao: string | null
    status: string
    ordem: number
    dueDate: string | null
    createdAt: string
}

export interface WindowsUser {
    displayName: string
    username: string
    avatarBase64: string | null
}

export interface AiActionRequest {
    action: string
    cardId: string
}

export interface AiActionResponse {
    content: string
    provider: string
    durationMs: number
}

export interface CommentData {
    id: string
    cardId: string
    autor: string
    texto: string
    createdAt: string
}

export interface ChecklistItemData {
    id: string
    cardId: string
    texto: string
    concluido: boolean
    ordem: number
    createdAt: string
}

export interface ReminderData {
    id: string
    cardId: string | null
    titulo: string
    descricao: string | null
    scheduleAt: string
    recurrence: string
    recurrenceDays: number | null
    snoozeUntil: string | null
    status: string
    createdAt: string
}

export interface PagedResponse<T> {
    content: T[]
    total: number
    page: number
    size: number
}

export interface ErrorResponse {
    type: string
    title: string
    status: number
    detail: string
}

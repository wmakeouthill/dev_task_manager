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

/** Resultado de insight individual por card */
export interface CardInsightResult {
    cardId: string
    cardTitle: string
    status: string
    content: string
    provider: string
    durationMs: number
}

/** Response do endpoint de insights por card */
export interface PerCardInsightsResponse {
    insights: CardInsightResult[]
    totalCards: number
    totalDurationMs: number
}

/** Insight persistido no banco */
export interface PersistedInsight {
    id: string
    cardId: string
    cardTitle: string
    status: string
    content: string
    provider: string
    action: string
    durationMs: number
    createdAt: string
}

/** Request para salvar insights no banco */
export interface SaveInsightsRequest {
    action: string
    insights: SaveInsightItem[]
    totalDurationMs: number
}

export interface SaveInsightItem {
    cardId: string
    cardTitle: string
    status: string
    content: string
    provider: string
    durationMs: number
}

/** Mensagem no histórico de chat IA */
export interface AiChatMessage {
    role: 'user' | 'assistant'
    content: string
}

/** Request para o chat IA do card */
export interface AiChatRequest {
    cardId: string
    message: string
    history?: AiChatMessage[]
    referencedCardIds?: string[]
}

/** Sugestão estruturada da IA */
export interface AiSuggestion {
    type: 'description' | 'subtasks' | 'general'
    content: string
    subtaskItems?: string[]
}

/** Response do chat IA */
export interface AiChatResponse {
    reply: string
    suggestions: AiSuggestion[]
    provider: string
    durationMs: number
}

/** Resultado de busca de cards */
export interface CardSearchResult {
    id: string
    titulo: string
    status: string
    boardId: string
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

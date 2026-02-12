import type { AiSuggestion } from '@/shared/types'

/** Mensagem persistida no histórico de chat */
export interface PersistedChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    suggestions?: AiSuggestion[]
}

/** Conversa persistida */
export interface ChatConversation {
    id: string
    cardId: string
    title: string
    messages: PersistedChatMessage[]
    createdAt: string
    updatedAt: string
}

const STORAGE_KEY = 'devtaskmanager:chat-history'

function loadAll(): ChatConversation[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

function saveAll(conversations: ChatConversation[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
}

/** Lista conversas de um card, mais recentes primeiro */
export function listConversations(cardId: string): ChatConversation[] {
    return loadAll()
        .filter((c) => c.cardId === cardId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

/** Busca conversa por ID */
export function getConversation(conversationId: string): ChatConversation | null {
    return loadAll().find((c) => c.id === conversationId) ?? null
}

/** Cria nova conversa vazia */
export function createConversation(cardId: string): ChatConversation {
    const conversation: ChatConversation = {
        id: crypto.randomUUID(),
        cardId,
        title: 'Nova conversa',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
    const all = loadAll()
    all.push(conversation)
    saveAll(all)
    return conversation
}

/** Atualiza mensagens e título de uma conversa existente */
export function updateConversation(
    conversationId: string,
    messages: PersistedChatMessage[],
    title?: string
) {
    const all = loadAll()
    const idx = all.findIndex((c) => c.id === conversationId)
    if (idx === -1) return

    all[idx].messages = messages
    all[idx].updatedAt = new Date().toISOString()
    if (title) all[idx].title = title
    saveAll(all)
}

/** Remove conversa */
export function deleteConversation(conversationId: string) {
    const all = loadAll().filter((c) => c.id !== conversationId)
    saveAll(all)
}

/** Gera título a partir da primeira mensagem do usuário */
export function generateTitle(messages: PersistedChatMessage[]): string {
    const firstUser = messages.find((m) => m.role === 'user')
    if (!firstUser) return 'Nova conversa'
    const text = firstUser.content.trim()
    return text.length > 50 ? text.substring(0, 50) + '…' : text
}

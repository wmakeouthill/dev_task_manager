/**
 * Serviço de notificações nativas do navegador / Windows.
 * Usa a Notification API para enviar toasts do sistema operacional.
 */

type PermissionStatus = 'granted' | 'denied' | 'default'

class NotificationService {
    private _permission: PermissionStatus = 'default'

    constructor() {
        if ('Notification' in window) {
            this._permission = Notification.permission as PermissionStatus
        }
    }

    get permission(): PermissionStatus {
        return this._permission
    }

    get isSupported(): boolean {
        return 'Notification' in window
    }

    async requestPermission(): Promise<PermissionStatus> {
        if (!this.isSupported) return 'denied'
        const result = await Notification.requestPermission()
        this._permission = result as PermissionStatus
        return this._permission
    }

    /**
     * Envia uma notificação nativa do SO.
     * Retorna a instância da Notification para controle (click, close, etc).
     */
    send(
        title: string,
        options?: {
            body?: string
            icon?: string
            tag?: string
            requireInteraction?: boolean
            onClick?: () => void
        }
    ): Notification | null {
        if (!this.isSupported || this._permission !== 'granted') return null

        const notification = new Notification(title, {
            body: options?.body,
            icon: options?.icon ?? '/favicon.svg',
            tag: options?.tag,
            requireInteraction: options?.requireInteraction ?? true,
        })

        if (options?.onClick) {
            notification.onclick = () => {
                window.focus()
                options.onClick?.()
                notification.close()
            }
        }

        return notification
    }
}

/** Singleton exportado */
export const notificationService = new NotificationService()

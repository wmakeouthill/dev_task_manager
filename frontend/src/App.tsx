import { Providers } from '@/app/providers'
import { AppRoutes } from '@/app/routes'
import { ReminderNotificationManager } from '@/shared/components/ReminderNotificationManager'

export default function App() {
  return (
    <Providers>
      <AppRoutes />
      <ReminderNotificationManager />
    </Providers>
  )
}

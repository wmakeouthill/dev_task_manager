import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { HomePage } from '@/features/dashboard/pages/HomePage'
import { BoardsPage, BoardKanbanPage } from '@/features/boards'
import { CardDetailPage } from '@/features/cards/pages/CardDetailPage/CardDetailPage'
import { RemindersPage } from '@/features/reminders/pages/RemindersPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/boards" element={<BoardsPage />} />
        <Route path="/boards/:boardId" element={<BoardKanbanPage />} />
        <Route path="/cards/:cardId" element={<CardDetailPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

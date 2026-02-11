import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BoardsPage } from '../pages/BoardsPage'

describe('BoardsPage', () => {
  it('deve exibir titulo Boards', () => {
    render(<BoardsPage />)
    expect(screen.getByRole('heading', { name: /boards/i })).toBeInTheDocument()
  })

  it('deve exibir mensagem de implementacao', () => {
    render(<BoardsPage />)
    const el = screen.getAllByText(/kanban em implementação/i)
    expect(el.length).toBeGreaterThanOrEqual(1)
  })
})
